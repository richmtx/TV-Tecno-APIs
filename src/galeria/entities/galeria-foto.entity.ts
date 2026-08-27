import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { GaleriaColeccion } from './galeria-coleccion.entity';

/**
 * Fotografía de una colección.
 *
 * Cada foto pertenece a una sola colección: si la misma imagen
 * debe aparecer en dos secciones, se sube dos veces.
 *
 * Solo se guarda el nombre del archivo. Las rutas de las variantes
 * se derivan de la colección y el nombre:
 *   uploads/galeria/<coleccionId>/thumb/<archivo>
 *   uploads/galeria/<coleccionId>/medium/<archivo>
 *   uploads/galeria/<coleccionId>/original/<archivo>
 */
@Entity('galeria_fotos')
export class GaleriaFoto {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ name: 'coleccion_id', type: 'int', unsigned: true })
    coleccionId: number;

    @ManyToOne(() => GaleriaColeccion, (coleccion) => coleccion.fotos, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'coleccion_id' })
    coleccion: GaleriaColeccion;

    /** Nombre generado por el servidor, sin ruta ni carpeta de variante. */
    @Column({ type: 'varchar', length: 160, unique: true })
    archivo: string;

    /** Nombre con el que se subió; alimenta el pie sugerido. */
    @Column({ name: 'archivo_original', type: 'varchar', length: 255, nullable: true })
    archivoOriginal: string | null;

    /** Opcional: solo las fotos que lo ameriten llevan pie. */
    @Column({ type: 'varchar', length: 200, nullable: true })
    pie: string | null;

    @Column({ type: 'smallint', unsigned: true, nullable: true })
    anio: number | null;

    @Column({ type: 'smallint', unsigned: true, nullable: true })
    ancho: number | null;

    @Column({ type: 'smallint', unsigned: true, nullable: true })
    alto: number | null;

    @Column({ name: 'peso_bytes', type: 'int', unsigned: true, nullable: true })
    pesoBytes: number | null;

    @Column({ type: 'smallint', unsigned: true, default: 0 })
    orden: number;

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
}