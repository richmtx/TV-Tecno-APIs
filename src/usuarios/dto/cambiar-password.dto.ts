import { IsString, Length } from 'class-validator';

export class CambiarPasswordDto {
    @IsString()
    passwordActual: string;

    @IsString()
    @Length(8, 72, { message: 'La nueva contraseña debe tener entre 8 y 72 caracteres' })
    passwordNueva: string;
}