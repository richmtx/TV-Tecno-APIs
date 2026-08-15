import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Rol } from '../enums/rol.enum';

export interface UsuarioToken {
    id: number;
    usuario: string;
    rol: Rol;
}

export const UsuarioActual = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): UsuarioToken => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);