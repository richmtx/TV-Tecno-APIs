import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcercaContenido } from '../entities/acerca-contenido.entity';
import { AcercaItem, GrupoItem } from '../entities/acerca-item.entity';
import { AcercaImagen, GrupoImagen } from '../entities/acerca-imagen.entity';
import { AcercaImagenesService } from './acerca-imagenes.service';
import { ActualizarContenidoDto } from '../dto/actualizar-contenido.dto';
import { ActualizarItemDto } from '../dto/actualizar-item.dto';
import { ActualizarImagenDto } from '../dto/actualizar-imagen.dto';
import { MIMES_PERMITIDOS_ACERCA, VarianteAcerca } from '../acerca.constants';

/** Id de la única fila de `acerca_contenido`. */
const CONTENIDO_ID = 1;

/** Imagen lista para el cliente, con sus URLs resueltas. */
export interface ImagenConUrls {
    clave: string;
    etiqueta: string;
    alt: string;
    ancho: number | null;
    alto: number | null;
    urls: Record<VarianteAcerca, string>;
}

/** Item listo para el cliente. */
export interface ItemPublico {
    clave: string;
    titulo: string;
    subtitulo: string | null;
    icono: string | null;
}

/** La página completa, en una sola respuesta. */
export interface AcercaCompleto {
    contenido: AcercaContenido;
    valores: ItemPublico[];
    cobertura: ItemPublico[];
    stats: ItemPublico[];
    imagenes: Record<GrupoImagen, ImagenConUrls[]>;
}

/**
 * Contenido administrable de la página "Acerca de".
 *
 * Todo el contenido nace en la migración: este servicio solo lee y
 * actualiza. No hay métodos de creación ni de borrado a propósito,
 * porque la página tiene una estructura fija y lo único que cambia
 * es qué dice cada hueco.
 */
@Injectable()
export class AcercaService {
    private readonly logger = new Logger(AcercaService.name);

    constructor(
        @InjectRepository(AcercaContenido)
        private readonly contenidoRepo: Repository<AcercaContenido>,
        @InjectRepository(AcercaItem)
        private readonly itemsRepo: Repository<AcercaItem>,
        @InjectRepository(AcercaImagen)
        private readonly imagenesRepo: Repository<AcercaImagen>,
        private readonly imagenes: AcercaImagenesService,
    ) { }

    // ------------------------------------------------------------
    // Lectura
    // ------------------------------------------------------------

    /**
     * La página entera en una sola llamada.
     * El sitio público la consume completa, así que devolverla
     * armada evita tres peticiones desde el navegador.
     */
    async obtenerTodo(): Promise<AcercaCompleto> {
        const [contenido, items, imagenes] = await Promise.all([
            this.obtenerContenido(),
            this.itemsRepo.find({ order: { grupo: 'ASC', orden: 'ASC' } }),
            this.imagenesRepo.find({ order: { grupo: 'ASC', orden: 'ASC' } }),
        ]);

        return {
            contenido,
            valores: this.itemsDe(items, 'valor'),
            cobertura: this.itemsDe(items, 'cobertura'),
            stats: this.itemsDe(items, 'stat'),
            imagenes: {
                hero: this.imagenesDe(imagenes, 'hero'),
                cobertura: this.imagenesDe(imagenes, 'cobertura'),
            },
        };
    }

    /**
     * El bloque de prosa.
     * Si la fila no existe es que la migración no corrió: no se crea
     * al vuelo, porque un registro vacío en producción es peor que
     * un error visible.
     */
    async obtenerContenido(): Promise<AcercaContenido> {
        const contenido = await this.contenidoRepo.findOne({
            where: { id: CONTENIDO_ID },
        });

        if (!contenido) {
            throw new NotFoundException(
                'No existe el contenido de Acerca de. Verifica que las migraciones se hayan ejecutado.',
            );
        }

        return contenido;
    }

    /** Los nueve items, para los formularios del panel. */
    listarItems(): Promise<AcercaItem[]> {
        return this.itemsRepo.find({ order: { grupo: 'ASC', orden: 'ASC' } });
    }

    /** Las seis imágenes, con sus URLs. */
    async listarImagenes(): Promise<ImagenConUrls[]> {
        const imagenes = await this.imagenesRepo.find({
            order: { grupo: 'ASC', orden: 'ASC' },
        });
        return imagenes.map((imagen) => this.aRespuestaImagen(imagen));
    }

    // ------------------------------------------------------------
    // Edición
    // ------------------------------------------------------------

    /** Reemplaza el bloque de prosa completo. */
    async actualizarContenido(
        dto: ActualizarContenidoDto,
        usuarioId: number,
    ): Promise<AcercaContenido> {
        const contenido = await this.obtenerContenido();

        Object.assign(contenido, dto);
        contenido.actualizadoPor = usuarioId;

        return this.contenidoRepo.save(contenido);
    }

    /** Edita un valor, un renglón de cobertura o un indicador. */
    async actualizarItem(
        clave: string,
        dto: ActualizarItemDto,
        usuarioId: number,
    ): Promise<AcercaItem> {
        const item = await this.obtenerItem(clave);

        item.titulo = dto.titulo.trim();

        if (dto.subtitulo !== undefined) {
            const subtitulo = dto.subtitulo?.trim() ?? '';
            item.subtitulo = subtitulo.length > 0 ? subtitulo : null;
        }
        if (dto.icono !== undefined) {
            const icono = dto.icono?.trim() ?? '';
            item.icono = icono.length > 0 ? icono : null;
        }

        item.actualizadoPor = usuarioId;
        return this.itemsRepo.save(item);
    }

    /**
     * Edita una imagen de posición fija.
     *
     * El archivo es opcional: sin él solo cambian los textos. Cuando
     * sí viene, el archivo anterior se elimina del disco únicamente
     * después de que el registro se guardó. Si se borrara antes y el
     * guardado fallara, la fila quedaría apuntando a un archivo que
     * ya no existe.
     */
    async actualizarImagen(
        clave: string,
        dto: ActualizarImagenDto,
        archivo: Express.Multer.File | undefined,
        usuarioId: number,
    ): Promise<ImagenConUrls> {
        const imagen = await this.obtenerImagen(clave);

        imagen.etiqueta = dto.etiqueta.trim();
        imagen.alt = dto.alt.trim();
        imagen.actualizadoPor = usuarioId;

        if (!archivo) {
            const guardada = await this.imagenesRepo.save(imagen);
            return this.aRespuestaImagen(guardada);
        }

        this.validarArchivo(archivo);

        const anterior = imagen.archivo;
        const procesada = await this.imagenes.procesar(archivo);

        imagen.archivo = procesada.archivo;
        imagen.archivoOriginal = procesada.archivoOriginal;
        imagen.ancho = procesada.ancho;
        imagen.alto = procesada.alto;
        imagen.pesoBytes = procesada.pesoBytes;

        let guardada: AcercaImagen;
        try {
            guardada = await this.imagenesRepo.save(imagen);
        } catch (error) {
            // El registro falló: se retira lo recién escrito y el
            // archivo anterior sigue intacto.
            await this.imagenes.eliminar(procesada.archivo);
            throw error;
        }

        // Ya nadie referencia el archivo viejo. Si su borrado falla,
        // no se propaga el error: la actualización sí tuvo éxito y
        // un archivo huérfano no justifica devolver un 500.
        try {
            await this.imagenes.eliminar(anterior);
        } catch (error) {
            this.logger.warn(
                `No se pudo eliminar el archivo anterior "${anterior}" del slot ${clave}.`,
                error,
            );
        }

        return this.aRespuestaImagen(guardada);
    }

    // ------------------------------------------------------------
    // Interno
    // ------------------------------------------------------------

    /** Rechaza archivos que no son imágenes de un formato aceptado. */
    private validarArchivo(archivo: Express.Multer.File): void {
        if (!archivo.buffer?.length) {
            throw new BadRequestException('El archivo llegó vacío.');
        }
        if (!MIMES_PERMITIDOS_ACERCA.includes(archivo.mimetype)) {
            throw new BadRequestException(
                `El formato ${archivo.mimetype} no es una imagen admitida.`,
            );
        }
    }

    private async obtenerItem(clave: string): Promise<AcercaItem> {
        const item = await this.itemsRepo.findOne({ where: { clave } });
        if (!item) {
            throw new NotFoundException(`No existe el elemento "${clave}" en Acerca de.`);
        }
        return item;
    }

    private async obtenerImagen(clave: string): Promise<AcercaImagen> {
        const imagen = await this.imagenesRepo.findOne({ where: { clave } });
        if (!imagen) {
            throw new NotFoundException(`No existe la imagen "${clave}" en Acerca de.`);
        }
        return imagen;
    }

    private itemsDe(items: AcercaItem[], grupo: GrupoItem): ItemPublico[] {
        return items
            .filter((item) => item.grupo === grupo)
            .map(({ clave, titulo, subtitulo, icono }) => ({
                clave,
                titulo,
                subtitulo,
                icono,
            }));
    }

    private imagenesDe(imagenes: AcercaImagen[], grupo: GrupoImagen): ImagenConUrls[] {
        return imagenes
            .filter((imagen) => imagen.grupo === grupo)
            .map((imagen) => this.aRespuestaImagen(imagen));
    }

    private aRespuestaImagen(imagen: AcercaImagen): ImagenConUrls {
        return {
            clave: imagen.clave,
            etiqueta: imagen.etiqueta,
            alt: imagen.alt,
            ancho: imagen.ancho,
            alto: imagen.alto,
            urls: this.imagenes.urlsDe(imagen.archivo),
        };
    }
}