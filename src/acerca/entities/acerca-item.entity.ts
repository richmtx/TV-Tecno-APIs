import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Grupo al que pertenece el item. */
export type GrupoItem = 'valor' | 'cobertura' | 'stat';

/**
 * Elementos de lista de "Acerca de": los tres valores, los tres
 * renglones de cobertura y los tres indicadores.
 *
 * Son nueve filas fijas. `clave` es el identificador estable con el
 * que el frontend y el panel se refieren a cada una: el id
 * autoincremental nunca aparece en la URL.
 */
@Entity('acerca_items')
export class AcercaItem {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'enum', enum: ['valor', 'cobertura', 'stat'] })
    grupo: GrupoItem;

    @Column({ type: 'varchar', length: 30, unique: true })
    clave: string;

    @Column({ type: 'tinyint', unsigned: true })
    orden: number;

    @Column({ type: 'varchar', length: 60 })
    titulo: string;

    /** Solo los indicadores lo usan: CANAL, AL AIRE, SEÑAL. */
    @Column({ type: 'varchar', length: 40, nullable: true })
    subtitulo: string | null;

    /** Solo cobertura lo usa: nombre del SVG que dibuja el frontend. */
    @Column({ type: 'varchar', length: 40, nullable: true })
    icono: string | null;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;
}