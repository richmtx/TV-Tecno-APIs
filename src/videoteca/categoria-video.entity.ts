import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Video } from './videoteca.entity';

@Entity('categorias_video')
export class CategoriaVideo {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 60, unique: true })
    nombre: string;

    @Column({ type: 'varchar', length: 60, unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    icono: string | null;

    @Column({ type: 'tinyint', unsigned: true, default: 0 })
    orden: number;

    @OneToMany(() => Video, (video) => video.categoria)
    videos: Video[];

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