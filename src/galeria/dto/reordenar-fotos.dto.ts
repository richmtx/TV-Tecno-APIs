import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

/**
 * Nuevo orden de las fotografías de una colección.
 * Se envía la lista completa de ids ya ordenada; el servicio
 * reasigna 1, 2, 3… de corrido.
 */
export class ReordenarFotosDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    ids: number[];
}