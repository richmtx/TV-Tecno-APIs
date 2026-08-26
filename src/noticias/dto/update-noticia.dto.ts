import { IsOptional, IsString, MaxLength, IsDateString, Matches } from 'class-validator';

export class UpdateNoticiaDto {
    @IsOptional() @IsString() @MaxLength(160)
    titulo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(180)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'El slug solo admite minúsculas, números y guiones.',
    })
    slug?: string;

    @IsOptional() @IsString() @MaxLength(255)
    descripcion?: string;

    @IsOptional() @IsString()
    contenido?: string;

    @IsOptional() @IsString() @MaxLength(40)
    etiqueta?: string;

    @IsOptional()
    @IsDateString({}, { message: 'fecha debe tener formato YYYY-MM-DD' })
    fecha?: string;

    @IsOptional() @IsString() @MaxLength(150)
    imagenAlt?: string;
}