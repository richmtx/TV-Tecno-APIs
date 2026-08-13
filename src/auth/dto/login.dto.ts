import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty({ message: 'El usuario es obligatorio' })
    @MaxLength(50)
    usuario: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(6)
    password: string;
}