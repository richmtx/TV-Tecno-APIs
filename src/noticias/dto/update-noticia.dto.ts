import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class UpdateNoticiaDto {
    @IsOptional() @IsString() @MaxLength(160)
    titulo?: string;

    @IsOptional() @IsString() @MaxLength(255)
    descripcion?: string;

    @IsOptional() @IsString() @MaxLength(40)
    etiqueta?: string;

    @IsOptional()
    @IsDateString({}, { message: 'fecha debe tener formato YYYY-MM-DD' })
    fecha?: string;

    @IsOptional() @IsString() @MaxLength(150)
    imagenAlt?: string;
}