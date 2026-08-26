import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index, } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Entity('noticias')
@Index('idx_noticias_fecha', ['fecha'])
export class Noticia {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 160 })
    titulo: string;

    @Column({ type: 'varchar', length: 180, unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 255 })
    descripcion: string;

    @Column({ type: 'longtext', nullable: true })
    contenido: string | null;

    @Column({ name: 'tiempo_lectura', type: 'smallint', unsigned: true, nullable: true })
    tiempoLectura: number | null;

    @Column({ type: 'varchar', length: 40 })
    etiqueta: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ name: 'imagen_url', type: 'varchar', length: 255, nullable: true })
    imagenUrl: string | null;

    @Column({ name: 'imagen_alt', type: 'varchar', length: 150, nullable: true })
    imagenAlt: string | null;

    @Column({ type: 'tinyint', unsigned: true, comment: '1 = noticia destacada' })
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