import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne,
    OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { GaleriaSeccion } from './galeria-seccion.entity';
import { GaleriaCategoria } from './galeria-categoria.entity';
import { GaleriaFoto } from './galeria-foto.entity';

export type EstadoColeccion = 'borrador' | 'publicado';

/**
 * Época, álbum, instalación o momento estudiantil.
 *
 * Una sola entidad porque las cuatro son lo mismo: un conjunto de
 * fotografías con identidad propia. Los campos que no aplican a
 * una sección quedan nulos.
 *
 * El total de fotos no se almacena: se calcula con COUNT sobre
 * galeria_fotos. Un contador guardado se desincroniza siempre.
 */
@Entity('galeria_colecciones')
export class GaleriaColeccion {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ name: 'seccion_id', type: 'int', unsigned: true })
    seccionId: number;

    @ManyToOne(() => GaleriaSeccion, (seccion) => seccion.colecciones)
    @JoinColumn({ name: 'seccion_id' })
    seccion: GaleriaSeccion;

    @Column({ name: 'categoria_id', type: 'int', unsigned: true, nullable: true })
    categoriaId: number | null;

    @ManyToOne(() => GaleriaCategoria, (categoria) => categoria.colecciones, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoria_id' })
    categoria: GaleriaCategoria | null;

    /** Segmento de URL, único dentro de la sección. */
    @Column({ type: 'varchar', length: 80 })
    slug: string;

    @Column({ type: 'varchar', length: 120 })
    titulo: string;

    @Column({ type: 'varchar', length: 120, nullable: true })
    subtitulo: string | null;

    @Column({ type: 'varchar', length: 300, nullable: true })
    descripcion: string | null;

    @Column({ name: 'anio_inicio', type: 'smallint', unsigned: true, nullable: true })
    anioInicio: number | null;

    /** Nulo cuando la colección es la época abierta. */
    @Column({ name: 'anio_fin', type: 'smallint', unsigned: true, nullable: true })
    anioFin: number | null;

    /** Época abierta: "2011 - Actualidad". Solo una por sección. */
    @Column({ name: 'es_actual', type: 'tinyint', width: 1, default: 0 })
    esActual: boolean;

    /** Nulo en secciones con orden automático. */
    @Column({ type: 'smallint', unsigned: true, nullable: true })
    orden: number | null;

    @Column({ name: 'portada_foto_id', type: 'int', unsigned: true, nullable: true })
    portadaFotoId: number | null;

    /** Portada: una de las fotos de esta misma colección. */
    @ManyToOne(() => GaleriaFoto, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'portada_foto_id' })
    portada: GaleriaFoto | null;

    @Column({ type: 'enum', enum: ['borrador', 'publicado'], default: 'borrador' })
    estado: EstadoColeccion;

    @Column({ name: 'publicado_en', type: 'datetime', nullable: true })
    publicadoEn: Date | null;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'creado_por', type: 'int', unsigned: true, nullable: true })
    creadoPor: number | null;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;

    /** Borrado suave: TypeORM excluye estas filas de las consultas. */
    @DeleteDateColumn({ name: 'eliminado_en', type: 'datetime', nullable: true })
    eliminadoEn: Date | null;

    @Column({ name: 'eliminado_por', type: 'int', unsigned: true, nullable: true })
    eliminadoPor: number | null;

    @OneToMany(() => GaleriaFoto, (foto) => foto.coleccion)
    fotos: GaleriaFoto[];
}