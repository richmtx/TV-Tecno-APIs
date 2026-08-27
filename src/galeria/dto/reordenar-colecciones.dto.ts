import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

/**
 * Nuevo orden de las colecciones de una sección.
 * Se envía la lista completa de ids en el orden deseado; el
 * servicio reasigna 1, 2, 3… de corrido.
 */
export class ReordenarColeccionesDto {
    @IsInt()
    @Min(1)
    seccionId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    ids: number[];
}