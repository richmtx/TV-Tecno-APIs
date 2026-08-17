import { IsEnum, IsString, Length, Matches, IsOptional } from 'class-validator';
import { Rol } from '../../auth/enums/rol.enum';

export class CrearUsuarioDto {
    @IsString()
    @Length(4, 50)
    @Matches(/^[a-zA-Z0-9._-]+$/, {
        message: 'El usuario solo puede contener letras, números, punto, guion y guion bajo',
    })
    usuario: string;

    @IsString()
    @Length(3, 120)
    nombreCompleto: string;

    @IsEnum(Rol, { message: 'El rol debe ser admin o editor' })
    rol: Rol;

    @IsOptional()
    @IsString()
    @Length(8, 72, { message: 'La contraseña debe tener entre 8 y 72 caracteres' })
    password?: string;
}