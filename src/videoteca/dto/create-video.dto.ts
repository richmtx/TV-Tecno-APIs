import {
    IsString, IsNotEmpty, MaxLength, IsOptional, IsInt,
    IsIn, IsDateString, Min, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVideoDto {
    @IsString() @IsNotEmpty() @MaxLength(160)
    titulo: string;

    @IsOptional() @IsString() @MaxLength(255)
    descripcion?: string;

    @Type(() => Number) @IsInt()
    categoriaId: number;

    @IsIn(['youtube', 'local'], { message: 'fuente debe ser youtube o local.' })
    fuente: 'youtube' | 'local';

    /** ID de YouTube o URL completa. Para fuente local se llena al subir el archivo. */
    @IsOptional() @IsString() @MaxLength(255)
    videoUrl?: string;

    @IsOptional() @Type(() => Number) @IsInt() @Min(1)
    duracionSegundos?: number;

    @IsOptional() @IsString() @MaxLength(150)
    miniaturaAlt?: string;

    @IsDateString({}, { message: 'fechaPublicacion debe tener formato YYYY-MM-DD' })
    fechaPublicacion: string;

    @IsOptional() @Type(() => Boolean) @IsBoolean()
    publicado?: boolean;
}