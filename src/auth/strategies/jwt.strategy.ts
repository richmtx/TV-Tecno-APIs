import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../../usuarios/usuarios.service';

export interface JwtPayload {
    sub: number;
    usuario: string;
    rol: 'admin' | 'editor';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private readonly usuariosService: UsuariosService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload) {
        const usuario = await this.usuariosService.buscarPorId(payload.sub);
        if (!usuario) {
            throw new UnauthorizedException('Usuario no válido o desactivado');
        }
        return { id: usuario.id, usuario: usuario.usuario, rol: usuario.rol };
    }
}