import { ArrayNotEmpty, IsArray, IsInt, IsOptional, Max, Min, } from 'class-validator';

/**
 * Acción sobre varias fotografías a la vez.
 *
 * Existe porque asignar el año foto por foto en una colección de
 * 120 imágenes no es un trabajo que un administrador vaya a hacer:
 * o se puede en lote, o el campo queda vacío para siempre.
 */
export class AsignarAnioLoteDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    ids: number[];

    /** Enviar sin año limpia el campo en todas las seleccionadas. */
    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2200)
    anio?: number;
}

/** Eliminación de varias fotografías a la vez. */
export class EliminarLoteDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    ids: number[];
}