import { Injectable, Logger } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import {
    ACERCA_UPLOADS_DIR,
    ACERCA_UPLOADS_URL,
    CALIDAD_ACERCA,
    DIMENSIONES_ACERCA,
    VarianteAcerca,
    VARIANTES_ACERCA,
} from '../acerca.constants';

/** Resultado del procesamiento de una imagen. */
export interface ImagenAcercaProcesada {
    archivo: string;
    archivoOriginal: string;
    ancho: number;
    alto: number;
    pesoBytes: number;
}

/**
 * Procesamiento y almacenamiento de las imágenes de "Acerca de".
 *
 * Cada imagen se guarda en dos variantes:
 *   uploads/acerca/thumb/<archivo>
 *   uploads/acerca/medium/<archivo>
 *
 * Es un servicio propio y no el de Galería porque aquel arma sus
 * rutas a partir del id de la colección, un concepto que aquí no
 * existe. Son seis imágenes: no vale la pena refactorizar un
 * servicio en producción para reutilizarlo.
 */
@Injectable()
export class AcercaImagenesService {
    private readonly logger = new Logger(AcercaImagenesService.name);

    /**
     * Procesa una imagen y escribe sus variantes en disco.
     * Si alguna falla, se eliminan las ya escritas antes de propagar
     * el error: así no queda basura de una imagen que nunca llegó a
     * la base de datos.
     */
    async procesar(archivo: Express.Multer.File): Promise<ImagenAcercaProcesada> {
        const nombre = this.generarNombre();
        const escritas: string[] = [];

        let ancho = 0;
        let alto = 0;
        let pesoBytes = 0;

        try {
            for (const variante of VARIANTES_ACERCA) {
                const resultado = await this.escribirVariante(
                    archivo.buffer,
                    variante,
                    nombre,
                );
                escritas.push(resultado.rutaCompleta);

                // Las dimensiones y el peso que se registran son los de
                // `medium`, que es la variante de referencia.
                if (variante === 'medium') {
                    ancho = resultado.ancho;
                    alto = resultado.alto;
                    pesoBytes = resultado.pesoBytes;
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
     * Elimina de disco las variantes de una imagen.
     * No falla si algún archivo ya no existe: el objetivo es que al
     * terminar no quede nada, no verificar que estuviera todo.
     */
    async eliminar(archivo: string): Promise<void> {
        const rutas = VARIANTES_ACERCA.map((variante) =>
            join(process.cwd(), ACERCA_UPLOADS_DIR, variante, archivo),
        );
        await this.limpiar(rutas);
    }

    /** Las URLs públicas de una imagen. */
    urlsDe(archivo: string): Record<VarianteAcerca, string> {
        return {
            thumb: `${ACERCA_UPLOADS_URL}/thumb/${archivo}`,
            medium: `${ACERCA_UPLOADS_URL}/medium/${archivo}`,
        };
    }

    // ------------------------------------------------------------
    // Interno
    // ------------------------------------------------------------

    private async escribirVariante(
        buffer: Buffer,
        variante: VarianteAcerca,
        nombre: string,
    ): Promise<{ rutaCompleta: string; ancho: number; alto: number; pesoBytes: number }> {
        const carpeta = join(process.cwd(), ACERCA_UPLOADS_DIR, variante);
        await mkdir(carpeta, { recursive: true });

        const { ancho: maxAncho, alto: maxAlto } = DIMENSIONES_ACERCA[variante];

        const salida = await sharp(buffer)
            .rotate() // Aplica la orientación EXIF antes de redimensionar.
            .resize(maxAncho, maxAlto, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: CALIDAD_ACERCA[variante] })
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

    /** Nombre único e impredecible. */
    private generarNombre(): string {
        return `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
    }

    /** Deja el nombre original en algo seguro de almacenar y mostrar. */
    private sanearNombre(nombre: string): string {
        return nombre
            .replace(/\.[^.]+$/, '')
            .replace(/[^\p{L}\p{N}\s._-]/gu, '')
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