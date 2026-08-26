import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega slug, contenido y tiempo_lectura a la tabla noticias.
 *
 * El slug se agrega en tres pasos porque la tabla ya tiene registros:
 * no se puede crear una columna NOT NULL UNIQUE sobre datos existentes.
 */
export class AgregarCamposNoticias1735000000000 implements MigrationInterface {
    name = 'AgregarCamposNoticias1735000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- slug: paso 1, columna nullable ---
        await queryRunner.query(`
      ALTER TABLE \`noticias\`
      ADD COLUMN \`slug\` varchar(180) NULL AFTER \`titulo\`
    `);

        // --- slug: paso 2, rellenar los registros existentes ---
        const slugs: Array<[number, string]> = [
            [1, 'estudiantes-itd-desarrollan-sistema-riego-inteligente-ia'],
            [2, 'itd-sede-congreso-tecnologia-innovacion-2026'],
            [3, 'firma-convenio-industria-regional-software'],
            [4, 'estudiantes-ganan-concurso-nacional-robotica'],
            [5, 'gran-presentacion-ballet-folclorico-itd'],
        ];

        for (const [id, slug] of slugs) {
            await queryRunner.query(
                `UPDATE \`noticias\` SET \`slug\` = ? WHERE \`id\` = ?`,
                [slug, id],
            );
        }

        // Red de seguridad: si hubiera algún registro fuera de la lista,
        // se le asigna un slug provisional para que el NOT NULL no falle.
        await queryRunner.query(`
      UPDATE \`noticias\`
      SET \`slug\` = CONCAT('noticia-', \`id\`)
      WHERE \`slug\` IS NULL
    `);

        // --- slug: paso 3, aplicar NOT NULL y UNIQUE ---
        await queryRunner.query(`
      ALTER TABLE \`noticias\`
      MODIFY COLUMN \`slug\` varchar(180) NOT NULL
    `);

        await queryRunner.query(`
      ALTER TABLE \`noticias\`
      ADD UNIQUE KEY \`uq_noticias_slug\` (\`slug\`)
    `);

        // --- contenido ---
        await queryRunner.query(`
      ALTER TABLE \`noticias\`
      ADD COLUMN \`contenido\` LONGTEXT NULL
      COMMENT 'Cuerpo de la noticia en HTML sanitizado'
      AFTER \`descripcion\`
    `);

        // --- tiempo_lectura ---
        // NULL significa "sin contenido": el sitio esconde el dato.
        await queryRunner.query(`
      ALTER TABLE \`noticias\`
      ADD COLUMN \`tiempo_lectura\` smallint unsigned NULL
      COMMENT 'Minutos estimados, calculado desde contenido'
      AFTER \`contenido\`
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`noticias\` DROP COLUMN \`tiempo_lectura\`
    `);
        await queryRunner.query(`
      ALTER TABLE \`noticias\` DROP COLUMN \`contenido\`
    `);
        await queryRunner.query(`
      ALTER TABLE \`noticias\` DROP INDEX \`uq_noticias_slug\`
    `);
        await queryRunner.query(`
      ALTER TABLE \`noticias\` DROP COLUMN \`slug\`
    `);
    }
}