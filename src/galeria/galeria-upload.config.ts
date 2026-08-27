import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { ARCHIVOS_MAXIMOS, PESO_MAXIMO_BYTES } from './galeria.constants';

/**
 * Opciones de subida para las fotografías de la Galería.
 *
 * Se usa almacenamiento en memoria porque `sharp` procesa el buffer
 * directamente: escribir un temporal en disco para leerlo y luego
 * borrarlo no aporta nada.
 *
 * El techo de memoria es el producto de los dos límites: 40
 * archivos de 25 MB son 1 GB en el peor caso. Si el servidor del
 * ITD tuviera poca RAM, conviene bajar ARCHIVOS_MAXIMOS antes que
 * el peso por archivo.
 */
export const galeriaUploadOptions: MulterOptions = {
    storage: memoryStorage(),
    limits: {
        fileSize: PESO_MAXIMO_BYTES,
        files: ARCHIVOS_MAXIMOS,
    },
};