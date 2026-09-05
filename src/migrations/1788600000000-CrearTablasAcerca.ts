import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las tablas del contenido administrable de "Acerca de".
 *
 * Las tres nacen pobladas con el contenido que hoy está escrito en
 * el frontend: el módulo solo expone GET y PUT, así que ninguna fila
 * puede crearse después. La semilla vive aquí y no en el API.
 */
export class CrearTablasAcerca1788600000000 implements MigrationInterface {
    name = 'CrearTablasAcerca1788600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ------------------------------------------------------------
        // acerca_contenido — fila única con los bloques de prosa
        // ------------------------------------------------------------
        await queryRunner.query(`
      CREATE TABLE \`acerca_contenido\` (
        \`id\` tinyint unsigned NOT NULL COMMENT 'Siempre 1: tabla de fila única',

        \`hero_eyebrow\`      varchar(40)  NOT NULL COMMENT 'Texto dorado sobre el título: XHITD 16.1',
        \`hero_titulo\`       varchar(80)  NOT NULL,
        \`hero_subtitulo\`    varchar(180) NOT NULL,

        \`mv_eyebrow\`        varchar(40)  NOT NULL COMMENT 'QUIÉNES SOMOS',
        \`mv_titulo\`         varchar(80)  NOT NULL COMMENT 'Misión y visión',
        \`mision_titulo\`     varchar(120) NOT NULL,
        \`mision_texto\`      varchar(600) NOT NULL,
        \`vision_titulo\`     varchar(120) NOT NULL,
        \`vision_texto\`      varchar(600) NOT NULL,

        \`cobertura_eyebrow\` varchar(40)  NOT NULL COMMENT 'COBERTURA',
        \`cobertura_titulo\`  varchar(120) NOT NULL,
        \`cobertura_texto\`   varchar(400) NOT NULL,

        \`creado_en\`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`actualizado_por\` int unsigned DEFAULT NULL,

        PRIMARY KEY (\`id\`),
        KEY \`fk_acerca_contenido_actualizado_por\` (\`actualizado_por\`),
        CONSTRAINT \`fk_acerca_contenido_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`chk_acerca_contenido_fila_unica\` CHECK (\`id\` = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        // ------------------------------------------------------------
        // acerca_items — valores, renglones de cobertura y stats
        // ------------------------------------------------------------
        await queryRunner.query(`
      CREATE TABLE \`acerca_items\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`grupo\` enum('valor','cobertura','stat') NOT NULL,
        \`clave\` varchar(30) NOT NULL COMMENT 'Identificador estable usado por el frontend',
        \`orden\` tinyint unsigned NOT NULL,
        \`titulo\` varchar(60) NOT NULL COMMENT 'Identidad / Streaming en vivo / 16.1',
        \`subtitulo\` varchar(40) DEFAULT NULL COMMENT 'Solo stats: CANAL, AL AIRE, SEÑAL',
        \`icono\` varchar(40) DEFAULT NULL COMMENT 'Solo cobertura: nombre del SVG inline',

        \`creado_en\`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`actualizado_por\` int unsigned DEFAULT NULL,

        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_acerca_items_clave\` (\`clave\`),
        UNIQUE KEY \`uq_acerca_items_grupo_orden\` (\`grupo\`,\`orden\`),
        KEY \`fk_acerca_items_actualizado_por\` (\`actualizado_por\`),
        CONSTRAINT \`fk_acerca_items_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        // ------------------------------------------------------------
        // acerca_imagenes — 6 slots fijos
        // ------------------------------------------------------------
        await queryRunner.query(`
      CREATE TABLE \`acerca_imagenes\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`grupo\` enum('hero','cobertura') NOT NULL,
        \`clave\` varchar(30) NOT NULL COMMENT 'Slot fijo que consulta el frontend',
        \`orden\` tinyint unsigned NOT NULL,
        \`archivo\` varchar(160) NOT NULL COMMENT 'Nombre generado por el servidor, sin ruta ni carpeta de variante',
        \`archivo_original\` varchar(255) DEFAULT NULL,
        \`etiqueta\` varchar(40) NOT NULL COMMENT 'Badge guinda sobre la foto',
        \`alt\` varchar(160) NOT NULL,
        \`ancho\` smallint unsigned DEFAULT NULL,
        \`alto\` smallint unsigned DEFAULT NULL,
        \`peso_bytes\` int unsigned DEFAULT NULL,

        \`creado_en\`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`actualizado_por\` int unsigned DEFAULT NULL,

        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_acerca_imagenes_clave\` (\`clave\`),
        UNIQUE KEY \`uq_acerca_imagenes_archivo\` (\`archivo\`),
        UNIQUE KEY \`uq_acerca_imagenes_grupo_orden\` (\`grupo\`,\`orden\`),
        KEY \`fk_acerca_imagenes_actualizado_por\` (\`actualizado_por\`),
        CONSTRAINT \`fk_acerca_imagenes_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        // ------------------------------------------------------------
        // Semilla
        // ------------------------------------------------------------
        await queryRunner.query(`
      INSERT INTO \`acerca_contenido\` (
        \`id\`, \`hero_eyebrow\`, \`hero_titulo\`, \`hero_subtitulo\`,
        \`mv_eyebrow\`, \`mv_titulo\`,
        \`mision_titulo\`, \`mision_texto\`, \`vision_titulo\`, \`vision_texto\`,
        \`cobertura_eyebrow\`, \`cobertura_titulo\`, \`cobertura_texto\`
      ) VALUES (
        1,
        'XHITD 16.1',
        'Somos TV Tecno',
        'El canal oficial del Instituto Tecnológico de Durango',
        'QUIÉNES SOMOS',
        'Misión y visión',
        'Contar el Tecnológico desde adentro',
        'Brindar comunicación audiovisual pública y digital desde el Instituto Tecnológico de Durango mediante producciones innovadoras, inclusivas y de calidad que divulguen la ciencia, la tecnología y la cultura generadas en la institución, fortalezcan el vínculo entre nuestra comunidad y la sociedad duranguense, y contribuyan a la formación de los estudiantes que participan en su creación.',
        'Ser la referencia educativa del norte del país',
        'Consolidarnos hacia 2030 como el medio de comunicación universitario de mayor alcance en Durango y un referente en el norte de México, reconocidos por la calidad de nuestras producciones, la innovación tecnológica, la co-creación de contenidos con la comunidad estudiantil y una programación sostenible que genere valor público, identidad y arraigo en la región.',
        'COBERTURA',
        'Transmitimos para todo Durango',
        'Nuestra señal llega a plataformas digitales, redes sociales y el circuito interno del campus — en vivo y bajo demanda.'
      )
    `);

        await queryRunner.query(`
      INSERT INTO \`acerca_items\` (\`grupo\`, \`clave\`, \`orden\`, \`titulo\`, \`subtitulo\`, \`icono\`) VALUES
        ('valor',     'valor_identidad',      1, 'Identidad',                       NULL,      NULL),
        ('valor',     'valor_colaboracion',   2, 'Colaboración',                    NULL,      NULL),
        ('valor',     'valor_innovacion',     3, 'Innovación',                      NULL,      NULL),
        ('cobertura', 'cobertura_streaming',  1, 'Streaming en vivo',               NULL,      'senal'),
        ('cobertura', 'cobertura_circuito',   2, 'Circuito interno del campus ITD', NULL,      'tv'),
        ('cobertura', 'cobertura_demanda',    3, 'Contenido bajo demanda en redes', NULL,      'play'),
        ('stat',      'stat_canal',           1, '16.1',                            'CANAL',   NULL),
        ('stat',      'stat_aire',            2, '24/7',                            'AL AIRE', NULL),
        ('stat',      'stat_senal',           3, 'HD',                              'SEÑAL',   NULL)
    `);

        // Los nombres de archivo son provisionales: se reemplazan
        // desde el panel en cuanto el PUT esté disponible.
        await queryRunner.query(`
      INSERT INTO \`acerca_imagenes\` (\`grupo\`, \`clave\`, \`orden\`, \`archivo\`, \`etiqueta\`, \`alt\`) VALUES
        ('hero',      'hero_casa',        1, 'pendiente-casa.webp',        'Nuestra Casa',      'Escultura del ADN frente al edificio del Instituto Tecnológico de Durango'),
        ('hero',      'hero_noticiero',   2, 'pendiente-noticiero.webp',   'Noticiero',         'Set del noticiero de TV Tecno con mapamundi al fondo'),
        ('hero',      'hero_entrevistas', 3, 'pendiente-entrevistas.webp', 'Entrevistas',       'Mesa de entrevistas con micrófonos y plantas'),
        ('hero',      'hero_foro',        4, 'pendiente-foro.webp',        'Foro Musical',      'Foro musical con batería, teclado y guitarra'),
        ('cobertura', 'cobertura_torre',  1, 'pendiente-torre.webp',       'Torre transmisora', 'Fachada del ITD con la torre transmisora'),
        ('cobertura', 'cobertura_cabina', 2, 'pendiente-cabina.webp',      'Cabina de control', 'Cabina de control con pantalla del logotipo TV ITD')
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`acerca_imagenes\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`acerca_items\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`acerca_contenido\``);
    }
}