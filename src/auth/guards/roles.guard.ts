import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requeridos?.length) return true;

        const { user } = context.switchToHttp().getRequest();
        if (!requeridos.includes(user?.rol)) {
            throw new ForbiddenException('No tienes permisos para esta acción');
        }
        return true;
    }
}