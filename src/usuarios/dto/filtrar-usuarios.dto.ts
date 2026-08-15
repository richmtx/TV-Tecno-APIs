import { IsOptional, IsEnum, IsString, Length } from 'class-validator';
import { Rol } from '../../auth/enums/rol.enum';

export class FiltrarUsuariosDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    buscar?: string;

    @IsOptional()
    @IsEnum(Rol)
    rol?: Rol;
}