import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Filtros del listado de colecciones en el panel. */
export class ListarColeccionesDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    seccionId?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    categoriaId?: number;

    @IsOptional()
    @IsIn(['borrador', 'publicado'])
    estado?: 'borrador' | 'publicado';

    @IsOptional()
    @IsString()
    busqueda?: string;

    @IsOptional()
    @IsIn(['true', 'false'])
    incluirEliminadas?: string;
}