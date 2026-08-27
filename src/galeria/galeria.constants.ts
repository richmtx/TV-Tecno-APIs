/**
 * Configuración de las imágenes de la Galería.
 * Un solo lugar para los tamaños, los límites y las rutas.
 */

/** Carpeta raíz de las imágenes, relativa a la raíz del proyecto. */
export const GALERIA_UPLOADS_DIR = 'uploads/galeria';

/** Prefijo público con el que se sirven las imágenes. */
export const GALERIA_UPLOADS_URL = '/uploads/galeria';

/** Variantes que se generan de cada fotografía. */
export const VARIANTES = ['thumb', 'medium', 'original'] as const;
export type Variante = (typeof VARIANTES)[number];

/**
 * Dimensiones máximas de cada variante, en píxeles.
 * La imagen se ajusta dentro de la caja sin recortar ni deformar,
 * y nunca se agranda si el original es más pequeño.
 */
export const DIMENSIONES: Record<Variante, { ancho: number; alto: number }> = {
    thumb: { ancho: 480, alto: 480 },
    medium: { ancho: 1400, alto: 1400 },
    original: { ancho: 2560, alto: 2560 },
};

/** Calidad de compresión WebP por variante. */
export const CALIDAD: Record<Variante, number> = {
    thumb: 72,
    medium: 80,
    original: 86,
};

/** Tipos MIME aceptados en la subida. */
export const MIMES_PERMITIDOS = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/tiff',
];

/** Tamaño máximo por archivo: 25 MB. */
export const PESO_MAXIMO_BYTES = 25 * 1024 * 1024;

/** Archivos máximos por petición. */
export const ARCHIVOS_MAXIMOS = 40;