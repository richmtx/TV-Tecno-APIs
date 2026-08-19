import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Entity('programacion_destacada')
export class ProgramacionDestacada {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 120 })
    titulo: string;

    @Column({ type: 'varchar', length: 40 })
    etiqueta: string;

    @Column({ type: 'varchar', length: 60 })
    dias: string;

    @Column({ name: 'hora_inicio', type: 'time' })
    horaInicio: string;

    @Column({ name: 'hora_fin', type: 'time', nullable: true })
    horaFin: string | null;

    @Column({ name: 'imagen_url', type: 'varchar', length: 255, nullable: true })
    imagenUrl: string | null;

    @Column({ name: 'imagen_alt', type: 'varchar', length: 150, nullable: true })
    imagenAlt: string | null;

    @Column({ type: 'tinyint', unsigned: true })
    orden: number;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;

    @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'actualizado_por' })
    usuarioActualizo: Usuario | null;
}