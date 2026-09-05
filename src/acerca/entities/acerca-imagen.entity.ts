import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Bloque de la página en el que vive la imagen. */
export type GrupoImagen = 'hero' | 'cobertura';

/**
 * Imágenes de posición fija de "Acerca de": las cuatro del mosaico
 * y las dos del bloque de cobertura.
 *
 * `clave` es el slot que el frontend consulta. El archivo se
 * reemplaza, la fila nunca: no hay alta ni baja, así que tampoco
 * hay borrado lógico ni `creado_por`.
 */
@Entity('acerca_imagenes')
export class AcercaImagen {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'enum', enum: ['hero', 'cobertura'] })
    grupo: GrupoImagen;

    @Column({ type: 'varchar', length: 30, unique: true })
    clave: string;

    @Column({ type: 'tinyint', unsigned: true })
    orden: number;

    @Column({ type: 'varchar', length: 160 })
    archivo: string;

    @Column({ name: 'archivo_original', type: 'varchar', length: 255, nullable: true })
    archivoOriginal: string | null;

    @Column({ type: 'varchar', length: 40 })
    etiqueta: string;

    @Column({ type: 'varchar', length: 160 })
    alt: string;

    @Column({ type: 'smallint', unsigned: true, nullable: true })
    ancho: number | null;

    @Column({ type: 'smallint', unsigned: true, nullable: true })
    alto: number | null;

    @Column({ name: 'peso_bytes', type: 'int', unsigned: true, nullable: true })
    pesoBytes: number | null;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;
}