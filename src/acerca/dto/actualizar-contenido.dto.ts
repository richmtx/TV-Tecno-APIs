import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Reemplazo completo del bloque de prosa.
 *
 * Todos los campos son obligatorios porque es un PUT: el formulario
 * del panel carga el registro entero y lo devuelve entero. Los
 * límites replican los de la base para que el diseño no se rompa
 * con un texto de tres párrafos donde caben dos renglones.
 */
export class ActualizarContenidoDto {
    @IsString() @IsNotEmpty() @MaxLength(40)
    heroEyebrow: string;

    @IsString() @IsNotEmpty() @MaxLength(80)
    heroTitulo: string;

    @IsString() @IsNotEmpty() @MaxLength(180)
    heroSubtitulo: string;

    @IsString() @IsNotEmpty() @MaxLength(40)
    mvEyebrow: string;

    @IsString() @IsNotEmpty() @MaxLength(80)
    mvTitulo: string;

    @IsString() @IsNotEmpty() @MaxLength(120)
    misionTitulo: string;

    @IsString() @IsNotEmpty() @MaxLength(600)
    misionTexto: string;

    @IsString() @IsNotEmpty() @MaxLength(120)
    visionTitulo: string;

    @IsString() @IsNotEmpty() @MaxLength(600)
    visionTexto: string;

    @IsString() @IsNotEmpty() @MaxLength(40)
    coberturaEyebrow: string;

    @IsString() @IsNotEmpty() @MaxLength(120)
    coberturaTitulo: string;

    @IsString() @IsNotEmpty() @MaxLength(400)
    coberturaTexto: string;
}