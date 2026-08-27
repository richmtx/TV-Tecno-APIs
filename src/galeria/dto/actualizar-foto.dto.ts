import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Edición de una fotografía concreta.
 * Ambos campos son opcionales por diseño: la mayoría de las fotos
 * de una colección nunca llevan pie ni año.
 */
export class ActualizarFotoDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    pie?: string;

    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2200)
    anio?: number;
}