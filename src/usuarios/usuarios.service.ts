import {
    Injectable, NotFoundException, ConflictException,
    BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Usuario } from './entities/usuario.entity';
import { Rol } from '../auth/enums/rol.enum';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
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
            .andWhere('u.activo = true')
            .getOne();
    }

    async buscarPorId(id: number): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ where: { id, activo: true } });
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
                '(u.nombreCompleto LIKE :b OR u.correo LIKE :b OR u.usuario LIKE :b)',
                { b: `%${filtros.buscar}%` },
            );
        }

        return qb.orderBy('u.rol', 'ASC')
            .addOrderBy('u.nombreCompleto', 'ASC')
            .getMany();
    }

    async obtenerEstadisticas() {
        const [total, admins, editores, inactivos] = await Promise.all([
            this.usuarioRepo.count(),
            this.usuarioRepo.count({ where: { rol: Rol.ADMIN } }),
            this.usuarioRepo.count({ where: { rol: Rol.EDITOR } }),
            this.usuarioRepo.count({ where: { activo: false } }),
        ]);

        return { total, admins, editores, inactivos };
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
            where: [{ usuario: dto.usuario }, { correo: dto.correo }],
        });

        if (duplicado) {
            const campo = duplicado.usuario === dto.usuario ? 'usuario' : 'correo';
            throw new ConflictException(`Ya existe una cuenta con ese ${campo}`);
        }

        const passwordPlano = dto.password ?? this.generarPassword();

        const nuevo = this.usuarioRepo.create({
            usuario: dto.usuario,
            nombreCompleto: dto.nombreCompleto,
            correo: dto.correo,
            rol: dto.rol,
            passwordHash: await bcrypt.hash(passwordPlano, RONDAS_BCRYPT),
            activo: true,
            debeCambiarPassword: false,
            creadoPorId: creadorId,
        });

        const guardado = await this.usuarioRepo.save(nuevo);
        const { passwordHash, ...limpio } = guardado;

        // Se devuelve una sola vez para que el admin se la entregue al usuario.
        return { ...limpio, passwordGenerada: dto.password ? undefined : passwordPlano };
    }

    async actualizar(id: number, dto: ActualizarUsuarioDto, editorId: number) {
        const usuario = await this.obtenerUno(id);

        if (dto.correo && dto.correo !== usuario.correo) {
            const existe = await this.usuarioRepo.findOne({
                where: { correo: dto.correo, id: Not(id) },
            });
            if (existe) {
                throw new ConflictException('Ya existe una cuenta con ese correo');
            }
        }

        const degradaAdmin = usuario.rol === Rol.ADMIN
            && dto.rol === Rol.EDITOR;
        const desactiva = usuario.activo && dto.activo === false;

        if (degradaAdmin || (desactiva && usuario.rol === Rol.ADMIN)) {
            await this.validarNoEsUltimoAdmin(id);
        }

        if (id === editorId && (dto.rol === Rol.EDITOR || dto.activo === false)) {
            throw new ForbiddenException('No puedes cambiar tu propio rol ni desactivar tu cuenta');
        }

        Object.assign(usuario, dto);
        return this.usuarioRepo.save(usuario);
    }

    async eliminar(id: number, ejecutorId: number) {
        if (id === ejecutorId) {
            throw new ForbiddenException('No puedes eliminar tu propia cuenta');
        }

        const usuario = await this.obtenerUno(id);

        if (usuario.rol === Rol.ADMIN) {
            await this.validarNoEsUltimoAdmin(id);
        }

        // Borrado lógico: preserva la referencia en creado_por.
        usuario.activo = false;
        await this.usuarioRepo.save(usuario);

        return { mensaje: `La cuenta de ${usuario.nombreCompleto} fue desactivada` };
    }

    async reactivar(id: number) {
        const usuario = await this.obtenerUno(id);
        usuario.activo = true;
        await this.usuarioRepo.save(usuario);
        return { mensaje: `La cuenta de ${usuario.nombreCompleto} fue reactivada` };
    }

    async cambiarPassword(id: number, dto: CambiarPasswordDto) {
        const usuario = await this.usuarioRepo
            .createQueryBuilder('u')
            .addSelect('u.passwordHash')
            .where('u.id = :id', { id })
            .getOne();

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const coincide = await bcrypt.compare(dto.passwordActual, usuario.passwordHash);
        if (!coincide) {
            throw new BadRequestException('La contraseña actual no es correcta');
        }

        if (dto.passwordActual === dto.passwordNueva) {
            throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
        }

        await this.usuarioRepo.update(id, {
            passwordHash: await bcrypt.hash(dto.passwordNueva, RONDAS_BCRYPT),
            debeCambiarPassword: false,
        });

        return { mensaje: 'Contraseña actualizada' };
    }

    async resetearPassword(id: number, passwordNueva?: string) {
        const usuario = await this.obtenerUno(id);
        const passwordPlano = passwordNueva ?? this.generarPassword();

        await this.usuarioRepo.update(id, {
            passwordHash: await bcrypt.hash(passwordPlano, RONDAS_BCRYPT),
        });

        return {
            mensaje: `Contraseña restablecida para ${usuario.nombreCompleto}`,
            passwordGenerada: passwordNueva ? undefined : passwordPlano,
        };
    }

    private async validarNoEsUltimoAdmin(idExcluido: number): Promise<void> {
        const otrosAdmins = await this.usuarioRepo.count({
            where: { rol: Rol.ADMIN, activo: true, id: Not(idExcluido) },
        });

        if (otrosAdmins === 0) {
            throw new ForbiddenException(
                'Debe existir al menos un administrador activo en el sistema',
            );
        }
    }

    private generarPassword(): string {
        return `TvT-${randomBytes(6).toString('base64url')}`;
    }
}