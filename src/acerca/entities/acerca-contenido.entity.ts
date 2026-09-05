import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Bloques de prosa de la página "Acerca de".
 *
 * Es una tabla de fila única: siempre existe el registro con id 1 y
 * nunca hay otro. La restricción CHECK lo garantiza incluso si
 * alguien entra por fuera del API.
 */
@Entity('acerca_contenido')
export class AcercaContenido {
    @PrimaryColumn({ type: 'tinyint', unsigned: true })
    id: number;

    @Column({ name: 'hero_eyebrow', type: 'varchar', length: 40 })
    heroEyebrow: string;

    @Column({ name: 'hero_titulo', type: 'varchar', length: 80 })
    heroTitulo: string;

    @Column({ name: 'hero_subtitulo', type: 'varchar', length: 180 })
    heroSubtitulo: string;

    @Column({ name: 'mv_eyebrow', type: 'varchar', length: 40 })
    mvEyebrow: string;

    @Column({ name: 'mv_titulo', type: 'varchar', length: 80 })
    mvTitulo: string;

    @Column({ name: 'mision_titulo', type: 'varchar', length: 120 })
    misionTitulo: string;

    @Column({ name: 'mision_texto', type: 'varchar', length: 600 })
    misionTexto: string;

    @Column({ name: 'vision_titulo', type: 'varchar', length: 120 })
    visionTitulo: string;

    @Column({ name: 'vision_texto', type: 'varchar', length: 600 })
    visionTexto: string;

    @Column({ name: 'cobertura_eyebrow', type: 'varchar', length: 40 })
    coberturaEyebrow: string;

    @Column({ name: 'cobertura_titulo', type: 'varchar', length: 120 })
    coberturaTitulo: string;

    @Column({ name: 'cobertura_texto', type: 'varchar', length: 400 })
    coberturaTexto: string;

    @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
    actualizadoEn: Date;

    @Column({ name: 'actualizado_por', type: 'int', unsigned: true, nullable: true })
    actualizadoPor: number | null;
}