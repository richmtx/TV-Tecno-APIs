import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    usuario: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
    passwordHash: string;

    @Column({ name: 'nombre_completo', type: 'varchar', length: 120 })
    nombreCompleto: string;

    @Column({ type: 'varchar', length: 150, nullable: true, unique: true })
    correo: string | null;

    @Column({ type: 'enum', enum: ['admin', 'editor'], default: 'editor' })
    rol: 'admin' | 'editor';

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @Column({ name: 'ultimo_acceso', type: 'datetime', nullable: true })
    ultimoAcceso: Date | null;

    @CreateDateColumn({ name: 'creado_en' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en' })
    actualizadoEn: Date;
}