import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CategoriaVideo } from './categoria-video.entity';

export type FuenteVideo = 'youtube' | 'local';

@Entity('videoteca')
@Index('idx_videoteca_fecha', ['publicado', 'fechaPublicacion'])
@Index('idx_videoteca_vistas', ['publicado', 'vistas'])
export class Video {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 160 })
    titulo: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    descripcion: string | null;

    @Column({ name: 'categoria_id', type: 'int', unsigned: true })
    categoriaId: number;

    @ManyToOne(() => CategoriaVideo, (c) => c.videos, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'categoria_id' })
    categoria: CategoriaVideo;

    @Column({ type: 'enum', enum: ['youtube', 'local'], default: 'youtube' })
    fuente: FuenteVideo;

    @Column({ name: 'video_url', type: 'varchar', length: 255 })
    videoUrl: string;

    @Column({ name: 'duracion_segundos', type: 'int', unsigned: true, nullable: true })
    duracionSegundos: number | null;

    @Column({ name: 'miniatura_url', type: 'varchar', length: 255, nullable: true })
    miniaturaUrl: string | null;

    @Column({ name: 'miniatura_alt', type: 'varchar', length: 150, nullable: true })
    miniaturaAlt: string | null;

    @Column({ type: 'int', unsigned: true, default: 0 })
    vistas: number;

    @Column({ name: 'fecha_publicacion', type: 'date' })
    fechaPublicacion: string;

    @Column({ type: 'boolean', default: true })
    publicado: boolean;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @Column({ name: 'creado_por', type: 'int', unsigned: true, nullable: true })
    creadoPor: number | null;

    @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'creado_por' })
    usuarioCreo: Usuario | null;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;

    @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'actualizado_por' })
    usuarioActualizo: Usuario | null;
}