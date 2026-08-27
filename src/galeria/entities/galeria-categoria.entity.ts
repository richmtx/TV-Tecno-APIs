import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
    UpdateDateColumn, } from 'typeorm';
import { GaleriaSeccion } from './galeria-seccion.entity';
import { GaleriaColeccion } from './galeria-coleccion.entity';

/**
 * Categoría temática dentro de una sección: los chips de
 * Instalaciones y las categorías de Álbumes y Estudiantes.
 * En tabla para que el administrador agregue una nueva sin
 * necesidad de un despliegue.
 */
@Entity('galeria_categorias')
export class GaleriaCategoria {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ name: 'seccion_id', type: 'int', unsigned: true })
    seccionId: number;

    @ManyToOne(() => GaleriaSeccion, (seccion) => seccion.categorias, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'seccion_id' })
    seccion: GaleriaSeccion;

    @Column({ type: 'varchar', length: 40 })
    slug: string;

    @Column({ type: 'varchar', length: 60 })
    nombre: string;

    @Column({ type: 'tinyint', unsigned: true, default: 0 })
    orden: number;

    @Column({ type: 'tinyint', width: 1, default: 1 })
    activo: boolean;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'creado_por', type: 'int', unsigned: true, nullable: true })
    creadoPor: number | null;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;

    @OneToMany(() => GaleriaColeccion, (coleccion) => coleccion.categoria)
    colecciones: GaleriaColeccion[];
}