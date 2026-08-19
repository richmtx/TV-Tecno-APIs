import { IsOptional, IsIn, IsInt, IsString, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrarVideosDto {
    /** Slug de categoría. Omitir = todos los videos. */
    @IsOptional() @IsString() @MaxLength(60)
    categoria?: string;

    @IsOptional()
    @IsIn(['hoy', 'semana', 'mes', 'anio'], {
        message: 'periodo debe ser: hoy, semana, mes o anio.',
    })
    periodo?: 'hoy' | 'semana' | 'mes' | 'anio';

    @IsOptional()
    @IsIn(['recientes', 'antiguos', 'vistos'])
    orden?: 'recientes' | 'antiguos' | 'vistos';

    @IsOptional() @IsString() @MaxLength(100)
    busqueda?: string;

    @IsOptional() @Type(() => Number) @IsInt() @Min(1)
    pagina?: number;

    @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48)
    limite?: number;
}