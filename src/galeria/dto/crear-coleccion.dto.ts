import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, } from 'class-validator';

/**
 * Datos para crear una colección.
 *
 * El slug, el orden y el estado no se reciben: el servicio genera
 * el primero a partir del título, calcula el segundo según la
 * sección, y toda colección nace como borrador.
 */
export class CrearColeccionDto {
    @IsInt()
    @Min(1)
    seccionId: number;

    @IsString()
    @MinLength(2)
    @MaxLength(120)
    titulo: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    categoriaId?: number;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    subtitulo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    descripcion?: string;

    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2200)
    anioInicio?: number;

    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2200)
    anioFin?: number;

    @IsOptional()
    @IsBoolean()
    esActual?: boolean;
}