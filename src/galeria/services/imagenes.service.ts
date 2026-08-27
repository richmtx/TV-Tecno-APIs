import { Injectable, Logger } from '@nestjs/common';
import { mkdir, rm, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { CALIDAD, DIMENSIONES, GALERIA_UPLOADS_DIR, GALERIA_UPLOADS_URL,
    Variante, VARIANTES, } from '../galeria.constants';

/** Resultado del procesamiento de una imagen. */
export interface ImagenProcesada {
    /** Nombre del archivo generado, común a las tres variantes. */
    archivo: string;
    /** Nombre con el que se subió, ya saneado. */
    archivoOriginal: string;
    /** Dimensiones de la variante `original`. */
    ancho: number;
    alto: number;
    /** Peso en disco de la variante `original`. */
    pesoBytes: number;
}

/**
 * Procesamiento y almacenamiento de las fotografías de la Galería.
 *
 * Cada imagen se guarda en tres variantes dentro de la carpeta de
 * su colección:
 *   uploads/galeria/<coleccionId>/thumb/<archivo>
 *   uploads/galeria/<coleccionId>/medium/<archivo>
 *   uploads/galeria/<coleccionId>/original/<archivo>
 *
 * Dividir por colección permite eliminar una colección completa con
 * una sola operación sobre el sistema de archivos, y evita tener
 * que consultar la sección para armar la ruta de una foto.
 *
 * Todas las variantes se convierten a WebP: pesa entre un 25 % y un
 * 35 % menos que JPEG con calidad equivalente, y lo soportan todos
 * los navegadores vigentes.
 */
@Injectable()
export class ImagenesService {
    private readonly logger = new Logger(ImagenesService.name);

    /**
     * Procesa una imagen y escribe sus tres variantes en disco.
     *
     * Si alguna variante falla, se eliminan las que ya se habían
     * escrito antes de propagar el error: así no quedan archivos
     * huérfanos de una foto que nunca llegó a la base de datos.
     */
    async procesar(
        archivo: Express.Multer.File,
        coleccionId: number,
    ): Promise<ImagenProcesada> {
        const nombre = this.generarNombre();
        const escritas: string[] = [];

        try {
            // Se leen los metadatos una sola vez, del buffer en memoria.
            const metadatos = await sharp(archivo.buffer).metadata();

            let ancho = metadatos.width ?? 0;
            let alto = metadatos.height ?? 0;
            let pesoBytes = 0;

            for (const variante of VARIANTES) {
                const ruta = await this.escribirVariante(
                    archivo.buffer,
                    coleccionId,
                    variante,
                    nombre,
                );
                escritas.push(ruta.rutaCompleta);

                // Las dimensiones y el peso que se guardan son los de la
                // variante `original`, que es la que sirve de referencia.
                if (variante === 'original') {
                    ancho = ruta.ancho;
                    alto = ruta.alto;
                    pesoBytes = ruta.pesoBytes;
                }
            }

            return {
                archivo: nombre,
                archivoOriginal: this.sanearNombre(archivo.originalname),
                ancho,
                alto,
                pesoBytes,
            };
        } catch (error) {
            await this.limpiar(escritas);
            throw error;
        }
    }

    /**
     * Elimina de disco las tres variantes de una fotografía.
     * No falla si algún archivo ya no existe: el objetivo es que al
     * terminar no quede nada, no verificar que estuviera todo.
     */
    async eliminar(coleccionId: number, archivo: string): Promise<void> {
        const rutas = VARIANTES.map((variante) =>
            join(process.cwd(), GALERIA_UPLOADS_DIR, String(coleccionId), variante, archivo),
        );
        await this.limpiar(rutas);
    }

    /**
     * Elimina la carpeta completa de una colección.
     * Se usa al purgar definitivamente una colección de la papelera.
     */
    async eliminarColeccion(coleccionId: number): Promise<void> {
        const carpeta = join(process.cwd(), GALERIA_UPLOADS_DIR, String(coleccionId));
        try {
            await rm(carpeta, { recursive: true, force: true });
        } catch (error) {
            this.logger.error(`No se pudo eliminar la carpeta ${carpeta}`, error);
        }
    }

    /** URL pública de una variante concreta. */
    urlDe(coleccionId: number, archivo: string, variante: Variante): string {
        return `${GALERIA_UPLOADS_URL}/${coleccionId}/${variante}/${archivo}`;
    }

    /** Las tres URLs públicas de una fotografía. */
    urlsDe(coleccionId: number, archivo: string): Record<Variante, string> {
        return {
            thumb: this.urlDe(coleccionId, archivo, 'thumb'),
            medium: this.urlDe(coleccionId, archivo, 'medium'),
            original: this.urlDe(coleccionId, archivo, 'original'),
        };
    }

    // ------------------------------------------------------------
    // Interno
    // ------------------------------------------------------------

    /**
     * Redimensiona y escribe una variante.
     * `fit: 'inside'` conserva la proporción y encaja la imagen dentro
     * de la caja; `withoutEnlargement` evita agrandar un original
     * pequeño, que solo produciría un archivo más pesado y borroso.
     */
    private async escribirVariante(
        buffer: Buffer,
        coleccionId: number,
        variante: Variante,
        nombre: string,
    ): Promise<{ rutaCompleta: string; ancho: number; alto: number; pesoBytes: number }> {
        const carpeta = join(
            process.cwd(),
            GALERIA_UPLOADS_DIR,
            String(coleccionId),
            variante,
        );
        await mkdir(carpeta, { recursive: true });

        const { ancho: maxAncho, alto: maxAlto } = DIMENSIONES[variante];

        const salida = await sharp(buffer)
            .rotate() // Aplica la orientación EXIF antes de redimensionar.
            .resize(maxAncho, maxAlto, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: CALIDAD[variante] })
            .toBuffer({ resolveWithObject: true });

        const rutaCompleta = join(carpeta, nombre);
        await writeFile(rutaCompleta, salida.data);

        return {
            rutaCompleta,
            ancho: salida.info.width,
            alto: salida.info.height,
            pesoBytes: salida.info.size,
        };
    }

    /**
     * Nombre único e impredecible.
     * El timestamp mantiene los archivos agrupados por fecha de
     * subida al listar la carpeta; los bytes aleatorios evitan
     * colisiones entre subidas simultáneas.
     */
    private generarNombre(): string {
        return `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
    }

    /**
     * Deja el nombre original en algo seguro de almacenar y mostrar.
     * Sirve para proponer un pie de foto, no para construir rutas.
     */
    private sanearNombre(nombre: string): string {
        return nombre
            .replace(/\.[^.]+$/, '') // Quita la extensión.
            .replace(/[^\p{L}\p{N}\s._-]/gu, '') // Deja letras, números y separadores.
            .trim()
            .slice(0, 255);
    }

    /** Elimina archivos ignorando los que ya no existan. */
    private async limpiar(rutas: string[]): Promise<void> {
        await Promise.all(
            rutas.map(async (ruta) => {
                try {
                    await unlink(ruta);
                } catch (error: unknown) {
                    const codigo = (error as NodeJS.ErrnoException)?.code;
                    if (codigo !== 'ENOENT') {
                        this.logger.warn(`No se pudo eliminar ${ruta}: ${codigo}`);
                    }
                }
            }),
        );
    }
}