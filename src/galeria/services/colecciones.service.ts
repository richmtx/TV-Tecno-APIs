import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { GaleriaColeccion } from '../entities/galeria-coleccion.entity';
import { GaleriaSeccion } from '../entities/galeria-seccion.entity';
import { GaleriaCategoria } from '../entities/galeria-categoria.entity';
import { GaleriaFoto } from '../entities/galeria-foto.entity';
import { CrearColeccionDto } from '../dto/crear-coleccion.dto';
import { ActualizarColeccionDto } from '../dto/actualizar-coleccion.dto';
import { ReordenarColeccionesDto } from '../dto/reordenar-colecciones.dto';
import { ListarColeccionesDto } from '../dto/listar-colecciones.dto';
import { generarSlug, slugDeEliminado } from './slug.util';
import { ImagenesService } from './imagenes.service';

/** Colección con su conteo de fotos, que no se almacena. */
export interface ColeccionConTotal extends GaleriaColeccion {
  totalFotos: number;
}

/**
 * Gestión de las colecciones de la Galería.
 *
 * Concentra las reglas que la base de datos no puede garantizar
 * por sí sola: que las épocas no se traslapen, que solo una sea
 * la actual, y que los slugs sean únicos dentro de su sección.
 */
@Injectable()
export class ColeccionesService {
  constructor(
    @InjectRepository(GaleriaColeccion)
    private readonly coleccionesRepo: Repository<GaleriaColeccion>,
    @InjectRepository(GaleriaSeccion)
    private readonly seccionesRepo: Repository<GaleriaSeccion>,
    @InjectRepository(GaleriaCategoria)
    private readonly categoriasRepo: Repository<GaleriaCategoria>,
    @InjectRepository(GaleriaFoto)
    private readonly fotosRepo: Repository<GaleriaFoto>,
    private readonly imagenes: ImagenesService,
    private readonly dataSource: DataSource,
  ) {}

  // ------------------------------------------------------------
  // Lectura
  // ------------------------------------------------------------

  /** Listado del panel, con el conteo real de fotos de cada una. */
  async listar(filtros: ListarColeccionesDto): Promise<ColeccionConTotal[]> {
    const qb = this.coleccionesRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.seccion', 'seccion')
      .leftJoinAndSelect('c.categoria', 'categoria')
      .leftJoinAndSelect('c.portada', 'portada')
      .loadRelationCountAndMap('c.totalFotos', 'c.fotos', 'foto', (sub) =>
        sub.andWhere('foto.eliminado_en IS NULL'),
      );

    if (filtros.incluirEliminadas === 'true') {
      qb.withDeleted();
    }

    if (filtros.seccionId) {
      qb.andWhere('c.seccion_id = :seccionId', { seccionId: filtros.seccionId });
    }

    if (filtros.categoriaId) {
      qb.andWhere('c.categoria_id = :categoriaId', {
        categoriaId: filtros.categoriaId,
      });
    }

    if (filtros.estado) {
      qb.andWhere('c.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.busqueda?.trim()) {
      qb.andWhere('(c.titulo LIKE :q OR c.descripcion LIKE :q)', {
        q: `%${filtros.busqueda.trim()}%`,
      });
    }

    // Las secciones cronológicas se ordenan por año; las demás,
    // por el orden manual que definió el administrador.
    qb.orderBy('seccion.orden', 'ASC')
      .addOrderBy('c.anio_inicio', 'ASC')
      .addOrderBy('c.orden', 'ASC')
      .addOrderBy('c.id', 'ASC');

    return (await qb.getMany()) as ColeccionConTotal[];
  }

  /** Una colección por id, con su conteo de fotos. */
  async obtener(id: number): Promise<ColeccionConTotal> {
    const coleccion = await this.coleccionesRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.seccion', 'seccion')
      .leftJoinAndSelect('c.categoria', 'categoria')
      .leftJoinAndSelect('c.portada', 'portada')
      .loadRelationCountAndMap('c.totalFotos', 'c.fotos', 'foto', (sub) =>
        sub.andWhere('foto.eliminado_en IS NULL'),
      )
      .where('c.id = :id', { id })
      .getOne();

    if (!coleccion) {
      throw new NotFoundException(`No existe la colección ${id}.`);
    }

    return coleccion as ColeccionConTotal;
  }

  // ------------------------------------------------------------
  // Escritura
  // ------------------------------------------------------------

  /**
   * Crea una colección en estado borrador.
   *
   * Se ejecuta dentro de una transacción con bloqueo sobre las
   * colecciones de la sección: sin él, dos administradores creando
   * épocas al mismo tiempo podrían producir un traslape que ninguna
   * de las dos validaciones alcanza a ver.
   */
  async crear(dto: CrearColeccionDto, usuarioId: number): Promise<GaleriaColeccion> {
    return this.dataSource.transaction(async (manager) => {
      const seccion = await manager.findOne(GaleriaSeccion, {
        where: { id: dto.seccionId },
      });
      if (!seccion) {
        throw new NotFoundException(`No existe la sección ${dto.seccionId}.`);
      }

      await this.validarCategoria(manager, dto.categoriaId, seccion);

      const hermanas = await manager
        .createQueryBuilder(GaleriaColeccion, 'c')
        .setLock('pessimistic_write')
        .where('c.seccion_id = :seccionId', { seccionId: seccion.id })
        .getMany();

      if (seccion.usaRangoAnios) {
        this.validarRango(dto, hermanas, null);
      }

      const slug = await this.slugUnico(manager, seccion.id, dto.titulo, null);

      const coleccion = manager.create(GaleriaColeccion, {
        seccionId: seccion.id,
        categoriaId: dto.categoriaId ?? null,
        slug,
        titulo: dto.titulo.trim(),
        subtitulo: dto.subtitulo?.trim() ?? null,
        descripcion: dto.descripcion?.trim() ?? null,
        anioInicio: dto.anioInicio ?? null,
        anioFin: dto.esActual ? null : (dto.anioFin ?? null),
        esActual: dto.esActual ?? false,
        // El orden es manual solo donde la sección no lo calcula sola.
        orden: seccion.ordenAutomatico ? null : this.siguienteOrden(hermanas),
        estado: 'borrador',
        creadoPor: usuarioId,
        actualizadoPor: usuarioId,
      });

      // Al abrir una época nueva, la anterior deja de ser la actual.
      if (seccion.usaRangoAnios && coleccion.esActual) {
        await this.cerrarEpocaAbierta(manager, seccion.id, coleccion, null, usuarioId);
      }

      return manager.save(coleccion);
    });
  }

  /** Actualiza los datos de una colección. */
  async actualizar(
    id: number,
    dto: ActualizarColeccionDto,
    usuarioId: number,
  ): Promise<GaleriaColeccion> {
    return this.dataSource.transaction(async (manager) => {
      const coleccion = await manager.findOne(GaleriaColeccion, {
        where: { id },
        relations: { seccion: true },
      });
      if (!coleccion) {
        throw new NotFoundException(`No existe la colección ${id}.`);
      }

      const seccion = coleccion.seccion;
      await this.validarCategoria(manager, dto.categoriaId, seccion);

      const hermanas = await manager
        .createQueryBuilder(GaleriaColeccion, 'c')
        .setLock('pessimistic_write')
        .where('c.seccion_id = :seccionId', { seccionId: seccion.id })
        .getMany();

      if (seccion.usaRangoAnios) {
        this.validarRango(
          {
            anioInicio: dto.anioInicio ?? coleccion.anioInicio ?? undefined,
            anioFin: dto.anioFin ?? coleccion.anioFin ?? undefined,
            esActual: dto.esActual ?? coleccion.esActual,
          },
          hermanas,
          coleccion.id,
        );
      }

      if (dto.slug && dto.slug !== coleccion.slug) {
        const existe = hermanas.some(
          (h) => h.id !== coleccion.id && h.slug === dto.slug,
        );
        if (existe) {
          throw new ConflictException(
            `Ya hay una colección con el slug "${dto.slug}" en esta sección.`,
          );
        }
        coleccion.slug = dto.slug;
      }

      if (dto.titulo !== undefined) coleccion.titulo = dto.titulo.trim();
      if (dto.subtitulo !== undefined)
        coleccion.subtitulo = dto.subtitulo?.trim() ?? null;
      if (dto.descripcion !== undefined)
        coleccion.descripcion = dto.descripcion?.trim() ?? null;
      if (dto.categoriaId !== undefined)
        coleccion.categoriaId = dto.categoriaId ?? null;
      if (dto.anioInicio !== undefined)
        coleccion.anioInicio = dto.anioInicio ?? null;

      if (dto.esActual !== undefined) {
        coleccion.esActual = dto.esActual;
        if (dto.esActual) {
          coleccion.anioFin = null;
          await this.cerrarEpocaAbierta(
            manager,
            seccion.id,
            coleccion,
            coleccion.id,
            usuarioId,
          );
        }
      }

      if (dto.anioFin !== undefined && !coleccion.esActual) {
        coleccion.anioFin = dto.anioFin ?? null;
      }

      coleccion.actualizadoPor = usuarioId;
      return manager.save(coleccion);
    });
  }

  /**
   * Publica una colección.
   * Una colección sin fotos no se publica: en el sitio público
   * aparecería como una tarjeta vacía.
   */
  async publicar(id: number, usuarioId: number): Promise<GaleriaColeccion> {
    const coleccion = await this.coleccionesRepo.findOne({ where: { id } });
    if (!coleccion) {
      throw new NotFoundException(`No existe la colección ${id}.`);
    }

    const totalFotos = await this.fotosRepo.count({
      where: { coleccionId: id, eliminadoEn: IsNull() },
    });
    if (totalFotos === 0) {
      throw new BadRequestException(
        'No se puede publicar una colección sin fotografías.',
      );
    }

    coleccion.estado = 'publicado';
    coleccion.publicadoEn = new Date();
    coleccion.actualizadoPor = usuarioId;
    return this.coleccionesRepo.save(coleccion);
  }

  /** Regresa una colección a borrador; deja de verse en el sitio. */
  async despublicar(id: number, usuarioId: number): Promise<GaleriaColeccion> {
    const coleccion = await this.coleccionesRepo.findOne({ where: { id } });
    if (!coleccion) {
      throw new NotFoundException(`No existe la colección ${id}.`);
    }

    coleccion.estado = 'borrador';
    coleccion.actualizadoPor = usuarioId;
    return this.coleccionesRepo.save(coleccion);
  }

  /** Define cuál de las fotos de la colección es su portada. */
  async definirPortada(
    id: number,
    fotoId: number,
    usuarioId: number,
  ): Promise<GaleriaColeccion> {
    const coleccion = await this.coleccionesRepo.findOne({ where: { id } });
    if (!coleccion) {
      throw new NotFoundException(`No existe la colección ${id}.`);
    }

    const foto = await this.fotosRepo.findOne({
      where: { id: fotoId, coleccionId: id },
    });
    if (!foto) {
      throw new BadRequestException(
        'La portada debe ser una fotografía de esta misma colección.',
      );
    }

    coleccion.portadaFotoId = fotoId;
    coleccion.actualizadoPor = usuarioId;
    return this.coleccionesRepo.save(coleccion);
  }

  /**
   * Reasigna el orden de las colecciones de una sección.
   *
   * Se recibe la lista completa de ids ya ordenada y se numeran de
   * corrido. Reasignar todo evita los huecos y los empates que
   * dejaría mover una sola colección.
   */
  async reordenar(dto: ReordenarColeccionesDto, usuarioId: number): Promise<void> {
    const seccion = await this.seccionesRepo.findOne({
      where: { id: dto.seccionId },
    });
    if (!seccion) {
      throw new NotFoundException(`No existe la sección ${dto.seccionId}.`);
    }
    if (seccion.ordenAutomatico) {
      throw new BadRequestException(
        `Las colecciones de "${seccion.nombre}" se ordenan por año y no se pueden reordenar a mano.`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const hermanas = await manager.find(GaleriaColeccion, {
        where: { seccionId: dto.seccionId },
      });
      const idsValidos = new Set(hermanas.map((h) => h.id));

      const desconocidos = dto.ids.filter((id) => !idsValidos.has(id));
      if (desconocidos.length > 0) {
        throw new BadRequestException(
          `Estos identificadores no pertenecen a la sección: ${desconocidos.join(', ')}.`,
        );
      }
      if (dto.ids.length !== hermanas.length) {
        throw new BadRequestException(
          'Debes enviar todas las colecciones de la sección, en el orden deseado.',
        );
      }

      await Promise.all(
        dto.ids.map((id, indice) =>
          manager.update(GaleriaColeccion, id, {
            orden: indice + 1,
            actualizadoPor: usuarioId,
          }),
        ),
      );
    });
  }

  // ------------------------------------------------------------
  // Borrado
  // ------------------------------------------------------------

  /**
   * Envía una colección a la papelera junto con sus fotografías.
   *
   * El slug se renombra porque el índice único no distingue las
   * filas eliminadas: sin esto, el nombre quedaría bloqueado.
   * Los archivos en disco no se tocan todavía, para que restaurar
   * siga siendo posible.
   */
  async eliminar(id: number, usuarioId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const coleccion = await manager.findOne(GaleriaColeccion, { where: { id } });
      if (!coleccion) {
        throw new NotFoundException(`No existe la colección ${id}.`);
      }

      const ahora = new Date();

      await manager.update(
        GaleriaFoto,
        { coleccionId: id, eliminadoEn: IsNull() },
        { eliminadoEn: ahora, eliminadoPor: usuarioId },
      );

      await manager.update(GaleriaColeccion, id, {
        slug: slugDeEliminado(coleccion.slug),
        estado: 'borrador',
        eliminadoEn: ahora,
        eliminadoPor: usuarioId,
      });
    });
  }

  /**
   * Elimina definitivamente una colección y sus archivos.
   * La fila se borra de verdad y el `ON DELETE CASCADE` se lleva
   * sus fotografías; la carpeta se elimina completa.
   */
  async purgar(id: number): Promise<void> {
    const coleccion = await this.coleccionesRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!coleccion) {
      throw new NotFoundException(`No existe la colección ${id}.`);
    }
    if (!coleccion.eliminadoEn) {
      throw new BadRequestException(
        'Solo se pueden purgar colecciones que estén en la papelera.',
      );
    }

    await this.coleccionesRepo.delete(id);
    await this.imagenes.eliminarColeccion(id);
  }

  // ------------------------------------------------------------
  // Reglas internas
  // ------------------------------------------------------------

  /**
   * Verifica que el rango de años no choque con sus hermanas.
   *
   * MySQL no ofrece restricciones de exclusión como PostgreSQL, así
   * que el traslape se valida aquí, dentro de la transacción que ya
   * bloqueó las colecciones de la sección.
   */
  private validarRango(
    datos: { anioInicio?: number; anioFin?: number; esActual?: boolean },
    hermanas: GaleriaColeccion[],
    idPropio: number | null,
  ): void {
    const { anioInicio, esActual } = datos;
    const anioFin = esActual ? undefined : datos.anioFin;

    if (anioInicio === undefined) {
      throw new BadRequestException('Indica el año en que inicia esta época.');
    }
    if (!esActual && anioFin === undefined) {
      throw new BadRequestException(
        'Indica el año en que termina la época, o márcala como vigente.',
      );
    }
    if (anioFin !== undefined && anioFin < anioInicio) {
      throw new BadRequestException(
        'El año final no puede ser anterior al año inicial.',
      );
    }

    // Una época abierta se compara como si terminara muy adelante.
    const finPropio = anioFin ?? 9999;

    for (const hermana of hermanas) {
      if (hermana.id === idPropio || hermana.eliminadoEn) {
        continue;
      }
      if (hermana.anioInicio === null) {
        continue;
      }

      const finHermana = hermana.anioFin ?? 9999;
      const seTraslapan = anioInicio <= finHermana && finPropio >= hermana.anioInicio;

      if (seTraslapan) {
        throw new ConflictException(
          `El rango ${anioInicio}–${anioFin ?? 'actualidad'} se traslapa con "${hermana.titulo}".`,
        );
      }
    }
  }

  /**
   * Cierra la época que estaba marcada como vigente.
   * Su año final pasa a ser el anterior al inicio de la nueva, de
   * modo que las dos queden encadenadas sin hueco ni traslape.
   */
  private async cerrarEpocaAbierta(
    manager: typeof this.dataSource.manager,
    seccionId: number,
    nueva: GaleriaColeccion,
    idPropio: number | null,
    usuarioId: number,
  ): Promise<void> {
    const abiertas = await manager.find(GaleriaColeccion, {
      where: {
        seccionId,
        esActual: true,
        ...(idPropio ? { id: Not(idPropio) } : {}),
      },
    });

    for (const abierta of abiertas) {
      abierta.esActual = false;
      abierta.anioFin =
        nueva.anioInicio !== null
          ? nueva.anioInicio - 1
          : (abierta.anioInicio ?? new Date().getFullYear());
      abierta.actualizadoPor = usuarioId;
      await manager.save(abierta);
    }
  }

  /** La categoría debe existir y pertenecer a la misma sección. */
  private async validarCategoria(
    manager: typeof this.dataSource.manager,
    categoriaId: number | undefined,
    seccion: GaleriaSeccion,
  ): Promise<void> {
    if (categoriaId === undefined) {
      return;
    }
    const categoria = await manager.findOne(GaleriaCategoria, {
      where: { id: categoriaId },
    });
    if (!categoria || categoria.seccionId !== seccion.id) {
      throw new BadRequestException(
        `La categoría indicada no pertenece a "${seccion.nombre}".`,
      );
    }
  }

  /**
   * Genera un slug libre dentro de la sección.
   * Si el título produce uno que ya existe, se le añade un número:
   * "graduaciones", "graduaciones-2", "graduaciones-3"…
   */
  private async slugUnico(
    manager: typeof this.dataSource.manager,
    seccionId: number,
    titulo: string,
    idPropio: number | null,
  ): Promise<string> {
    const base = generarSlug(titulo);
    if (!base) {
      throw new BadRequestException(
        'El título debe contener al menos una letra o un número.',
      );
    }

    let candidato = base;
    let sufijo = 2;

    while (true) {
      const existente = await manager.findOne(GaleriaColeccion, {
        where: { seccionId, slug: candidato },
        withDeleted: true,
      });

      if (!existente || existente.id === idPropio) {
        return candidato;
      }

      candidato = `${base.slice(0, 76)}-${sufijo}`;
      sufijo++;
    }
  }

  /** Siguiente valor de orden manual dentro de la sección. */
  private siguienteOrden(hermanas: GaleriaColeccion[]): number {
    const maximo = hermanas.reduce(
      (max, h) => Math.max(max, h.orden ?? 0),
      0,
    );
    return maximo + 1;
  }
}