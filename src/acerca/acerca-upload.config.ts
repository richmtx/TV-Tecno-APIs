import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { PESO_MAXIMO_BYTES_ACERCA } from './acerca.constants';

/**
 * Opciones de subida para las imágenes de "Acerca de".
 *
 * Un solo archivo por petición: cada slot se reemplaza por separado.
 * Igual que en Galería, el almacenamiento es en memoria porque
 * `sharp` procesa el buffer directamente.
 */
export const acercaUploadOptions: MulterOptions = {
    storage: memoryStorage(),
    limits: {
        fileSize: PESO_MAXIMO_BYTES_ACERCA,
        files: 1,
    },
};