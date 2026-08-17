import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, Index, } from 'typeorm';
import { Rol } from '../../auth/enums/rol.enum';

@Entity('usuarios')
@Index('idx_usuarios_rol', ['rol'])
export class Usuario {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    usuario: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
    passwordHash: string;

    @Column({ name: 'nombre_completo', type: 'varchar', length: 120 })
    nombreCompleto: string;

    @Column({ type: 'enum', enum: Rol, default: Rol.EDITOR })
    rol: Rol;

    @Column({ name: 'ultimo_acceso', type: 'datetime', nullable: true })
    ultimoAcceso: Date | null;

    @CreateDateColumn({ name: 'creado_en' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en' })
    actualizadoEn: Date;

    @Column({ name: 'creado_por', type: 'int', unsigned: true, nullable: true })
    creadoPorId: number | null;

    @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'creado_por' })
    creadoPor: Usuario | null;
}