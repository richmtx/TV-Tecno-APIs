import { Injectable, NotFoundException, ConflictException, ForbiddenException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Usuario } from './entities/usuario.entity';
import { Rol } from '../auth/enums/rol.enum';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';

const RONDAS_BCRYPT = 10;

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
            .getOne();
    }

    async buscarPorId(id: number): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ where: { id } });
    }

    async registrarAcceso(id: number): Promise<void> {
        await this.usuarioRepo.update(id, { ultimoAcceso: new Date() });
    }

    async listar(filtros: FiltrarUsuariosDto): Promise<Usuario[]> {
        const qb = this.usuarioRepo.createQueryBuilder('u');

        if (filtros.rol) {
            qb.andWhere('u.rol = :rol', { rol: filtros.rol });
        }

        if (filtros.buscar) {
            qb.andWhere(
                '(u.nombreCompleto LIKE :b OR u.usuario LIKE :b)',
                { b: `%${filtros.buscar}%` },
            );
        }

        return qb.orderBy('u.rol', 'ASC')
            .addOrderBy('u.nombreCompleto', 'ASC')
            .getMany();
    }

    async obtenerEstadisticas() {
        const [total, admins, editores] = await Promise.all([
            this.usuarioRepo.count(),
            this.usuarioRepo.count({ where: { rol: Rol.ADMIN } }),
            this.usuarioRepo.count({ where: { rol: Rol.EDITOR } }),
        ]);

        return { total, admins, editores };
    }

    async obtenerUno(id: number): Promise<Usuario> {
        const usuario = await this.usuarioRepo.findOne({ where: { id } });
        if (!usuario) {
            throw new NotFoundException(`No existe el usuario con id ${id}`);
        }
        return usuario;
    }

    async crear(dto: CrearUsuarioDto, creadorId: number) {
        const duplicado = await this.usuarioRepo.findOne({
            where: { usuario: dto.usuario },
        });

        if (duplicado) {
            throw new ConflictException('Ya existe una cuenta con ese usuario');
        }

        const passwordPlano = dto.password ?? this.generarPassword();

        const nuevo = this.usuarioRepo.create({
            usuario: dto.usuario,
            nombreCompleto: dto.nombreCompleto,
            rol: dto.rol,
            passwordHash: await bcrypt.hash(passwordPlano, RONDAS_BCRYPT),
            creadoPorId: creadorId,
        });

        const guardado = await this.usuarioRepo.save(nuevo);
        const { passwordHash, ...limpio } = guardado;

        // Se devuelve una sola vez para que el admin se la entregue al usuario.
        return { ...limpio, passwordGenerada: dto.password ? undefined : passwordPlano };
    }

    /**
     * Borrado definitivo. La FK `creado_por` está declarada con
     * ON DELETE SET NULL, así que las cuentas creadas por este
     * usuario no se pierden: solo quedan sin referencia al creador.
     */
    async eliminar(id: number, ejecutorId: number) {
        if (id === ejecutorId) {
            throw new ForbiddenException('No puedes eliminar tu propia cuenta');
        }

        const usuario = await this.obtenerUno(id);

        if (usuario.rol === Rol.ADMIN) {
            await this.validarNoEsUltimoAdmin(id);
        }

        await this.usuarioRepo.delete(id);

        return { mensaje: `La cuenta de ${usuario.nombreCompleto} fue eliminada` };
    }

    private async validarNoEsUltimoAdmin(idExcluido: number): Promise<void> {
        const otrosAdmins = await this.usuarioRepo.count({
            where: { rol: Rol.ADMIN, id: Not(idExcluido) },
        });

        if (otrosAdmins === 0) {
            throw new ForbiddenException(
                'Debe existir al menos un administrador en el sistema',
            );
        }
    }

    private generarPassword(): string {
        return `TvT-${randomBytes(6).toString('base64url')}`;
    }
}