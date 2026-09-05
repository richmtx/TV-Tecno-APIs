import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Edición de un valor, un renglón de cobertura o un indicador.
 *
 * `grupo` y `orden` no se aceptan: definen la estructura de la
 * página, no su contenido, y cambiarlos rompería el índice único
 * de posición.
 */
export class ActualizarItemDto {
    @IsString() @IsNotEmpty() @MaxLength(60)
    titulo: string;

    /** Enviar cadena vacía o nulo lo limpia. */
    @IsOptional() @IsString() @MaxLength(40)
    subtitulo?: string | null;

    @IsOptional() @IsString() @MaxLength(40)
    icono?: string | null;
}