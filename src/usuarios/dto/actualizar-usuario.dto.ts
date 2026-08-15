import { IsEmail, IsEnum, IsString, Length, IsOptional, IsBoolean } from 'class-validator';
import { Rol } from '../../auth/enums/rol.enum';

export class ActualizarUsuarioDto {
    @IsOptional()
    @IsString()
    @Length(3, 120)
    nombreCompleto?: string;

    @IsOptional()
    @IsEmail({}, { message: 'El correo no tiene un formato válido' })
    @Length(5, 150)
    correo?: string;

    @IsOptional()
    @IsEnum(Rol, { message: 'El rol debe ser admin o editor' })
    rol?: Rol;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}