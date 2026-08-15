import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Rol } from '../enums/rol.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!rolesRequeridos || rolesRequeridos.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !rolesRequeridos.includes(user.rol)) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción');
        }

        return true;
    }
}