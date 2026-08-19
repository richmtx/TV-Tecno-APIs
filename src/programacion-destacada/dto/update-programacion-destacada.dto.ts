import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateProgramacionDestacadaDto {
    @IsOptional() @IsString() @MaxLength(120)
    titulo?: string;

    @IsOptional() @IsString() @MaxLength(40)
    etiqueta?: string;

    @IsOptional() @IsString() @MaxLength(60)
    dias?: string;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'horaInicio debe tener formato HH:mm o HH:mm:ss',
    })
    horaInicio?: string;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'horaFin debe tener formato HH:mm o HH:mm:ss',
    })
    horaFin?: string | null;

    @IsOptional() @IsString() @MaxLength(150)
    imagenAlt?: string;
}