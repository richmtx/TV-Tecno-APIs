/**
 * Configuración de las imágenes de "Acerca de".
 *
 * Son seis imágenes de posición fija que siempre se muestran al
 * mismo tamaño: no hay lightbox ni ampliación. Por eso se generan
 * dos variantes y no tres, y el techo es más bajo que en Galería.
 */

/** Carpeta raíz de las imágenes, relativa a la raíz del proyecto. */
export const ACERCA_UPLOADS_DIR = 'uploads/acerca';

/** Prefijo público con el que se sirven las imágenes. */
export const ACERCA_UPLOADS_URL = '/uploads/acerca';

/** Variantes que se generan de cada imagen. */
export const VARIANTES_ACERCA = ['thumb', 'medium'] as const;
export type VarianteAcerca = (typeof VARIANTES_ACERCA)[number];

/** Caja de dimensiones máximas de una variante, en píxeles. */
export interface DimensionesVariante {
    ancho: number;
    alto: number;
}

/**
 * Dimensiones máximas por variante.
 * `thumb` cubre móvil y el mosaico; `medium` cubre escritorio en
 * pantallas de alta densidad. La imagen se ajusta dentro de la caja
 * sin recortar, y nunca se agranda.
 */
export const DIMENSIONES_ACERCA: Record<VarianteAcerca, DimensionesVariante> = {
    thumb: { ancho: 800, alto: 800 },
    medium: { ancho: 1600, alto: 1600 },
};

/** Calidad de compresión WebP por variante. */
export const CALIDAD_ACERCA: Record<VarianteAcerca, number> = {
    thumb: 74,
    medium: 82,
};

/** Tipos MIME aceptados en la subida. */
export const MIMES_PERMITIDOS_ACERCA = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/tiff',
];

/** Tamaño máximo por archivo: 15 MB. */
export const PESO_MAXIMO_BYTES_ACERCA = 15 * 1024 * 1024;