import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { GaleriaCategoria } from './galeria-categoria.entity';
import { GaleriaColeccion } from './galeria-coleccion.entity';

/** Clave con la que el frontend identifica cada sección. */
export type SeccionClave = 'timeline' | 'albums' | 'instalaciones' | 'estudiantes';

/**
 * Sección de la Galería. Son cuatro filas fijas, pero viven en
 * tabla para que una quinta no requiera cambiar el esquema.
 *
 * Los indicadores describen cómo se comporta cada sección, de modo
 * que el panel arme el formulario correcto sin condicionales
 * escritas por nombre.
 */
@Entity('galeria_secciones')
export class GaleriaSeccion {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 20, unique: true })
    clave: SeccionClave;

    @Column({ type: 'varchar', length: 40, unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 60 })
    nombre: string;

    @Column({ type: 'tinyint', unsigned: true })
    orden: number;

    /** Las colecciones se ordenan por año; no se pueden arrastrar. */
    @Column({ name: 'orden_automatico', type: 'boolean', default: false })
    ordenAutomatico: boolean;

    /** Las colecciones tienen año de inicio y fin. */
    @Column({ name: 'usa_rango_anios', type: 'tinyint', width: 1, default: 0 })
    usaRangoAnios: boolean;

    @Column({ name: 'usa_categorias', type: 'tinyint', width: 1, default: 0 })
    usaCategorias: boolean;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;

    @OneToMany(() => GaleriaCategoria, (categoria) => categoria.seccion)
    categorias: GaleriaCategoria[];

    @OneToMany(() => GaleriaColeccion, (coleccion) => coleccion.seccion)
    colecciones: GaleriaColeccion[];
}