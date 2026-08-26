import sanitizeHtml from 'sanitize-html';

/**
 * Convierte un título en slug para la URL.
 * 'Estudiantes ganan concurso' → 'estudiantes-ganan-concurso'
 */
export function generarSlug(texto: string): string {
    return texto
        .normalize('NFD')                  // separa las letras de sus acentos
        .replace(/[\u0300-\u036f]/g, '')   // quita los acentos
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')      // fuera signos de puntuación
        .trim()
        .replace(/\s+/g, '-')              // espacios → guiones
        .replace(/-+/g, '-')               // colapsa guiones repetidos
        .slice(0, 180);
}

/**
 * Limpia el HTML que llega del editor del panel admin.
 * La lista blanca coincide con los estilos definidos en el sitio
 * público (.articulo__cuerpo): lo que no esté aquí, no se vería bien.
 */
export function sanitizarContenido(html: string): string {
    return sanitizeHtml(html, {
        allowedTags: [
            'p', 'br', 'strong', 'em', 'u', 's',
            'h2', 'h3',
            'ul', 'ol', 'li',
            'blockquote',
            'a',
        ],
        allowedAttributes: {
            a: ['href', 'title', 'target', 'rel'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        // Fuerza que los enlaces externos abran seguros
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', {
                target: '_blank',
                rel: 'noopener noreferrer',
            }),
        },
    });
}

/**
 * Calcula los minutos de lectura a partir del contenido HTML.
 * Devuelve null si no hay texto: el sitio esconde el dato en ese caso.
 */
export function calcularTiempoLectura(html: string | null): number | null {
    if (!html) return null;

    const texto = html.replace(/<[^>]*>/g, ' ').trim();
    if (!texto) return null;

    const palabras = texto.split(/\s+/).length;
    // 200 palabras por minuto es el promedio de lectura en español
    return Math.max(1, Math.round(palabras / 200));
}