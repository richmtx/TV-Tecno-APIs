import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Edición de una imagen de posición fija.
 *
 * Llega por multipart junto con el archivo, que es opcional: si no
 * viene, solo se actualizan los textos. Por eso el archivo no se
 * declara aquí, lo entrega el interceptor de Multer aparte.
 */
export class ActualizarImagenDto {
    @IsString() @IsNotEmpty() @MaxLength(40)
    etiqueta: string;

    @IsString() @IsNotEmpty() @MaxLength(160)
    alt: string;
}