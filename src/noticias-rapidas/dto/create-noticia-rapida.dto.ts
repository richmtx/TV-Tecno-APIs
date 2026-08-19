import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateNoticiaRapidaDto {
    @IsString()
    @IsNotEmpty({ message: 'El texto no puede estar vacío.' })
    @MaxLength(120, { message: 'Máximo 120 caracteres.' })
    texto: string;
}