import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        const usuario = await this.usuariosService.buscarParaLogin(dto.usuario);

        // Mismo mensaje en ambos casos: no revelamos si el usuario existe.
        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const coincide = await bcrypt.compare(dto.password, usuario.passwordHash);
        if (!coincide) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        await this.usuariosService.registrarAcceso(usuario.id);

        const payload = {
            sub: usuario.id,
            usuario: usuario.usuario,
            rol: usuario.rol,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            usuario: {
                id: usuario.id,
                usuario: usuario.usuario,
                nombreCompleto: usuario.nombreCompleto,
                rol: usuario.rol,
            },
        };
    }
}