/**
 * Convierte un texto en un slug apto para URL.
 * Separa los acentos de sus letras y los descarta, de modo que
 * "Áreas Verdes" se vuelve "areas-verdes" y no "reas-verdes".
 */
export function generarSlug(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/**
 * Marca el slug de una colección eliminada para liberar el nombre.
 *
 * El índice único de slug por sección no distingue entre filas
 * activas y eliminadas: sin este renombrado, borrar "graduaciones"
 * impediría volver a crear otra colección con ese nombre.
 */
export function slugDeEliminado(slug: string): string {
    const sufijo = `--eliminado-${Date.now()}`;
    return slug.slice(0, 80 - sufijo.length) + sufijo;
}