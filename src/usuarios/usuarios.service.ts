import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>,
    ) { }

    /** Incluye passwordHash explícitamente: solo para el login. */
    async buscarParaLogin(usuario: string): Promise<Usuario | null> {
        return this.usuarioRepo
            .createQueryBuilder('u')
            .addSelect('u.passwordHash')
            .where('u.usuario = :usuario', { usuario })
            .andWhere('u.activo = true')
            .getOne();
    }

    async buscarPorId(id: number): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ where: { id, activo: true } });
    }

    async registrarAcceso(id: number): Promise<void> {
        await this.usuarioRepo.update(id, { ultimoAcceso: new Date() });
    }
}