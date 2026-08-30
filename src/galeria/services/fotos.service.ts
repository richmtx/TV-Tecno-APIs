import { BadRequestException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { GaleriaFoto } from '../entities/galeria-foto.entity';
import { GaleriaColeccion } from '../entities/galeria-coleccion.entity';
import { ImagenesService } from './imagenes.service';
import { ActualizarFotoDto } from '../dto/actualizar-foto.dto';
import { AsignarAnioLoteDto, EliminarLoteDto } from '../dto/lote-fotos.dto';
import { ReordenarFotosDto } from '../dto/reordenar-fotos.dto';
import { MIMES_PERMITIDOS, Variante } from '../galeria.constants';

/** Fotografía lista para el cliente, con sus URLs resueltas. */
export interface FotoConUrls {
    id: number;
    coleccionId: number;
    pie: string | null;
    anio: number | null;
    ancho: number | null;
    alto: number | null;
    orden: number;
    urls: Record<Variante, string>;
}

/** Resultado de una subida múltiple. */
export interface ResultadoSubida {
    /** Fotografías que se procesaron y guardaron correctamente. */
    guardadas: FotoConUrls[];
    /** Archivos que fallaron, con el motivo, para reintentarlos. */
    fallidos: { archivo: string; motivo: string }[];
}

/**
 * Gestión de las fotografías de la Galería.
 *
 * La subida acepta varios archivos y procesa cada uno de forma
 * independiente: un archivo corrupto entre cuarenta no cancela
 * los demás, se reporta aparte para que el panel lo reintente.
 */
@Injectable()
export class FotosService {
    private readonly logger = new Logger(FotosService.name);

    constructor(
        @InjectRepository(GaleriaFoto)
        private readonly fotosRepo: Repository<GaleriaFoto>,
        @InjectRepository(GaleriaColeccion)
        private readonly coleccionesRepo: Repository<GaleriaColeccion>,
        private readonly imagenes: ImagenesService,
        private readonly dataSource: DataSource,
    ) { }

    // ------------------------------------------------------------
    // Lectura
    // ------------------------------------------------------------

    /** Fotografías activas de una colección, en su orden. */
    async listarDeColeccion(coleccionId: number): Promise<FotoConUrls[]> {
        await this.obtenerColeccion(coleccionId);

        const fotos = await this.fotosRepo.find({
            where: { coleccionId, eliminadoEn: IsNull() },
            order: { orden: 'ASC', id: 'ASC' },
        });

        return fotos.map((foto) => this.aRespuesta(foto));
    }

    // ------------------------------------------------------------
    // Subida
    // ------------------------------------------------------------

    /**
     * Procesa y guarda varias fotografías en una colección.
     *
     * Cada archivo se procesa por separado y en secuencia. En
     * secuencia y no en paralelo a propósito: `sharp` es intensivo en
     * CPU y memoria, y cuarenta redimensionamientos simultáneos
     * saturan el servidor sin terminar antes.
     *
     * Si el procesamiento de una imagen tiene éxito pero su registro
     * falla al guardarse, los archivos ya escritos se eliminan para
     * no dejar basura en disco.
     */
    async subir(
        coleccionId: number,
        archivos: Express.Multer.File[],
        usuarioId: number,
    ): Promise<ResultadoSubida> {
        const coleccion = await this.obtenerColeccion(coleccionId);

        if (!archivos?.length) {
            throw new BadRequestException('No se recibió ninguna imagen.');
        }

        const guardadas: FotoConUrls[] = [];
        const fallidos: { archivo: string; motivo: string }[] = [];

        // Las nuevas fotos se agregan al final de las existentes.
        let orden = await this.siguienteOrden(coleccionId);

        for (const archivo of archivos) {
            try {
                this.validarArchivo(archivo);

                const procesada = await this.imagenes.procesar(archivo, coleccionId);

                try {
                    const foto = this.fotosRepo.create({
                        coleccionId,
                        archivo: procesada.archivo,
                        archivoOriginal: procesada.archivoOriginal,
                        ancho: procesada.ancho,
                        alto: procesada.alto,
                        pesoBytes: procesada.pesoBytes,
                        orden: orden++,
                        creadoPor: usuarioId,
                        actualizadoPor: usuarioId,
                    });

                    const guardada = await this.fotosRepo.save(foto);
                    guardadas.push(this.aRespuesta(guardada));
                } catch (error) {
                    // El registro falló: se retiran los archivos ya escritos.
                    await this.imagenes.eliminar(coleccionId, procesada.archivo);
                    throw error;
                }
            } catch (error) {
                const motivo =
                    error instanceof BadRequestException
                        ? error.message
                        : 'No se pudo procesar la imagen.';

                this.logger.warn(
                    `Falló la subida de "${archivo.originalname}" en la colección ${coleccionId}: ${motivo}`,
                );
                fallidos.push({ archivo: archivo.originalname, motivo });
            }
        }

        // La primera subida define la portada si aún no había ninguna.
        if (!coleccion.portadaFotoId && guardadas.length > 0) {
            await this.coleccionesRepo.update(coleccionId, {
                portadaFotoId: guardadas[0].id,
                actualizadoPor: usuarioId,
            });
        }

        return { guardadas, fallidos };
    }

    // ------------------------------------------------------------
    // Edición
    // ------------------------------------------------------------

    /** Edita el pie y el año de una fotografía. */
    async actualizar(
        id: number,
        dto: ActualizarFotoDto,
        usuarioId: number,
    ): Promise<FotoConUrls> {
        const foto = await this.obtenerFoto(id);

        if (dto.pie !== undefined) {
            const pie = dto.pie.trim();
            foto.pie = pie.length > 0 ? pie : null;
        }
        if (dto.anio !== undefined) {
            foto.anio = dto.anio ?? null;
        }

        foto.actualizadoPor = usuarioId;
        const guardada = await this.fotosRepo.save(foto);
        return this.aRespuesta(guardada);
    }

    /**
     * Asigna el mismo año a varias fotografías.
     * Enviar el año vacío limpia el campo en todas las indicadas.
     */
    async asignarAnioEnLote(
        coleccionId: number,
        dto: AsignarAnioLoteDto,
        usuarioId: number,
    ): Promise<number> {
        await this.obtenerColeccion(coleccionId);
        const ids = await this.idsDeLaColeccion(coleccionId, dto.ids);

        const resultado = await this.fotosRepo.update(
            { id: In(ids) },
            { anio: dto.anio ?? null, actualizadoPor: usuarioId },
        );

        return resultado.affected ?? 0;
    }

    /**
     * Reasigna el orden de las fotografías de una colección.
     * Se recibe la lista completa ya ordenada y se numera de corrido,
     * lo que evita huecos y empates.
     */
    async reordenar(
        coleccionId: number,
        dto: ReordenarFotosDto,
        usuarioId: number,
    ): Promise<void> {
        await this.obtenerColeccion(coleccionId);

        await this.dataSource.transaction(async (manager) => {
            const activas = await manager.find(GaleriaFoto, {
                where: { coleccionId, eliminadoEn: IsNull() },
                select: { id: true },
            });
            const idsValidos = new Set(activas.map((f) => f.id));

            const ajenas = dto.ids.filter((id) => !idsValidos.has(id));
            if (ajenas.length > 0) {
                throw new BadRequestException(
                    `Estas fotografías no pertenecen a la colección: ${ajenas.join(', ')}.`,
                );
            }
            if (dto.ids.length !== activas.length) {
                throw new BadRequestException(
                    'Debes enviar todas las fotografías de la colección, en el orden deseado.',
                );
            }

            await Promise.all(
                dto.ids.map((id, indice) =>
                    manager.update(GaleriaFoto, id, {
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

    /** Envía una fotografía a la papelera. */
    async eliminar(id: number, usuarioId: number): Promise<void> {
        const foto = await this.obtenerFoto(id);
        await this.eliminarIds(foto.coleccionId, [foto.id], usuarioId);
    }

    /** Envía varias fotografías a la papelera de una vez. */
    async eliminarEnLote(
        coleccionId: number,
        dto: EliminarLoteDto,
        usuarioId: number,
    ): Promise<number> {
        await this.obtenerColeccion(coleccionId);
        const ids = await this.idsDeLaColeccion(coleccionId, dto.ids);
        return this.eliminarIds(coleccionId, ids, usuarioId);
    }

    /**
     * Elimina definitivamente las fotografías que llevan más de
     * `dias` en la papelera, junto con sus archivos en disco.
     * Pensado para ejecutarse desde una tarea programada.
     */
    async purgarAntiguas(dias = 30): Promise<number> {
        const limite = new Date();
        limite.setDate(limite.getDate() - dias);

        const fotos = await this.fotosRepo
            .createQueryBuilder('f')
            .withDeleted()
            .where('f.eliminado_en IS NOT NULL')
            .andWhere('f.eliminado_en < :limite', { limite })
            .getMany();

        for (const foto of fotos) {
            await this.imagenes.eliminar(foto.coleccionId, foto.archivo);
            await this.fotosRepo.delete(foto.id);
        }

        return fotos.length;
    }

    /**
 * Fotografías en la papelera que no pertenecen a una colección
 * eliminada: son las que el administrador borró por separado.
 */
    async listarPapelera(): Promise<number> {
        return this.fotosRepo
            .createQueryBuilder('f')
            .withDeleted()
            .innerJoin('f.coleccion', 'c')
            .where('f.eliminado_en IS NOT NULL')
            .andWhere('c.eliminado_en IS NULL')
            .getCount();
    }

    // ------------------------------------------------------------
    // Interno
    // ------------------------------------------------------------

    /**
     * Marca fotografías como eliminadas y reasigna la portada si la
     * colección se quedó sin ella.
     */
    private async eliminarIds(
        coleccionId: number,
        ids: number[],
        usuarioId: number,
    ): Promise<number> {
        return this.dataSource.transaction(async (manager) => {
            const resultado = await manager.update(
                GaleriaFoto,
                { id: In(ids), eliminadoEn: IsNull() },
                { eliminadoEn: new Date(), eliminadoPor: usuarioId },
            );

            const coleccion = await manager.findOne(GaleriaColeccion, {
                where: { id: coleccionId },
            });

            // Si la portada se fue con el lote, se toma la primera que quede.
            if (coleccion?.portadaFotoId && ids.includes(coleccion.portadaFotoId)) {
                const reemplazo = await manager.findOne(GaleriaFoto, {
                    where: { coleccionId, eliminadoEn: IsNull() },
                    order: { orden: 'ASC', id: 'ASC' },
                });

                await manager.update(GaleriaColeccion, coleccionId, {
                    portadaFotoId: reemplazo?.id ?? null,
                    actualizadoPor: usuarioId,
                });
            }

            return resultado.affected ?? 0;
        });
    }

    /** Rechaza archivos que no son imágenes de un formato aceptado. */
    private validarArchivo(archivo: Express.Multer.File): void {
        if (!archivo.buffer?.length) {
            throw new BadRequestException('El archivo llegó vacío.');
        }
        if (!MIMES_PERMITIDOS.includes(archivo.mimetype)) {
            throw new BadRequestException(
                `El formato ${archivo.mimetype} no es una imagen admitida.`,
            );
        }
    }

    /** Filtra los ids recibidos a los que sí son de la colección. */
    private async idsDeLaColeccion(
        coleccionId: number,
        ids: number[],
    ): Promise<number[]> {
        const fotos = await this.fotosRepo.find({
            where: { id: In(ids), coleccionId, eliminadoEn: IsNull() },
            select: { id: true },
        });

        if (fotos.length === 0) {
            throw new BadRequestException(
                'Ninguna de las fotografías indicadas pertenece a esta colección.',
            );
        }

        return fotos.map((f) => f.id);
    }

    private async obtenerColeccion(id: number): Promise<GaleriaColeccion> {
        const coleccion = await this.coleccionesRepo.findOne({ where: { id } });
        if (!coleccion) {
            throw new NotFoundException(`No existe la colección ${id}.`);
        }
        return coleccion;
    }

    private async obtenerFoto(id: number): Promise<GaleriaFoto> {
        const foto = await this.fotosRepo.findOne({ where: { id } });
        if (!foto) {
            throw new NotFoundException(`No existe la fotografía ${id}.`);
        }
        return foto;
    }

    /** Siguiente valor de orden dentro de la colección. */
    private async siguienteOrden(coleccionId: number): Promise<number> {
        const resultado = await this.fotosRepo
            .createQueryBuilder('f')
            .select('MAX(f.orden)', 'maximo')
            .where('f.coleccion_id = :coleccionId', { coleccionId })
            .getRawOne<{ maximo: number | null }>();

        return (resultado?.maximo ?? 0) + 1;
    }

    /** Convierte la entidad en la forma que consume el cliente. */
    private aRespuesta(foto: GaleriaFoto): FotoConUrls {
        return {
            id: foto.id,
            coleccionId: foto.coleccionId,
            pie: foto.pie,
            anio: foto.anio,
            ancho: foto.ancho,
            alto: foto.alto,
            orden: foto.orden,
            urls: this.imagenes.urlsDe(foto.coleccionId, foto.archivo),
        };
    }
}