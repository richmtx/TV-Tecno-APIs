import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Entity('noticias_rapidas')
@Index('idx_noticias_rapidas_orden', ['orden', 'id'])
export class NoticiaRapida {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 120 })
    texto: string;

    @Column({ type: 'tinyint', unsigned: true, default: 0 })
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