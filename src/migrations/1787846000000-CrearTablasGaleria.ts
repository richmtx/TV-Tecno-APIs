import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Galería, fase 1: secciones, categorías, colecciones y fotos.
 *
 * Incluye la semilla de las cuatro secciones con sus categorías y
 * las 37 colecciones que ya existían en el sitio público.
 *
 * Las tablas se crean de menos a más dependiente. La clave foránea
 * de la portada se agrega al final porque galeria_colecciones y
 * galeria_fotos se referencian mutuamente.
 */
export class CrearTablasGaleria1787846000000 implements MigrationInterface {
    name = 'CrearTablasGaleria1787846000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ---------- Estructura ----------

        await queryRunner.query(`
      CREATE TABLE \`galeria_secciones\` (
        \`id\`               int unsigned     NOT NULL AUTO_INCREMENT,
        \`clave\`            varchar(20)      NOT NULL COMMENT 'Identificador usado por el frontend: timeline, albums, instalaciones, estudiantes',
        \`slug\`             varchar(40)      NOT NULL COMMENT 'Segmento de URL: linea-del-tiempo, albumes, ...',
        \`nombre\`           varchar(60)      NOT NULL COMMENT 'Etiqueta visible de la pestaña',
        \`orden\`            tinyint unsigned NOT NULL,
        \`orden_automatico\` tinyint(1)       NOT NULL DEFAULT '0' COMMENT '1 = las colecciones se ordenan por año, sin arrastrar',
        \`usa_rango_anios\`  tinyint(1)       NOT NULL DEFAULT '0' COMMENT '1 = las colecciones tienen año de inicio y fin',
        \`usa_categorias\`   tinyint(1)       NOT NULL DEFAULT '0',
        \`creado_en\`        timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`   timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`actualizado_por\`  int unsigned     DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_galeria_secciones_clave\` (\`clave\`),
        UNIQUE KEY \`uq_galeria_secciones_slug\` (\`slug\`),
        UNIQUE KEY \`uq_galeria_secciones_orden\` (\`orden\`),
        CONSTRAINT \`fk_galeria_secciones_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`galeria_categorias\` (
        \`id\`              int unsigned     NOT NULL AUTO_INCREMENT,
        \`seccion_id\`      int unsigned     NOT NULL,
        \`slug\`            varchar(40)      NOT NULL,
        \`nombre\`          varchar(60)      NOT NULL COMMENT 'Etiqueta visible: Académicas, Laboratorios, ...',
        \`orden\`           tinyint unsigned NOT NULL DEFAULT '0',
        \`activo\`          tinyint(1)       NOT NULL DEFAULT '1',
        \`creado_en\`       timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`  timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`creado_por\`      int unsigned     DEFAULT NULL,
        \`actualizado_por\` int unsigned     DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_galeria_categorias_seccion_slug\` (\`seccion_id\`,\`slug\`),
        KEY \`idx_galeria_categorias_seccion_orden\` (\`seccion_id\`,\`orden\`),
        CONSTRAINT \`fk_galeria_categorias_seccion\`
          FOREIGN KEY (\`seccion_id\`) REFERENCES \`galeria_secciones\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_galeria_categorias_creado_por\`
          FOREIGN KEY (\`creado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_galeria_categorias_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`galeria_colecciones\` (
        \`id\`              int unsigned      NOT NULL AUTO_INCREMENT,
        \`seccion_id\`      int unsigned      NOT NULL,
        \`categoria_id\`    int unsigned      DEFAULT NULL,
        \`slug\`            varchar(80)       NOT NULL COMMENT 'Segmento de URL, único dentro de la sección',
        \`titulo\`          varchar(120)      NOT NULL,
        \`subtitulo\`       varchar(120)      DEFAULT NULL,
        \`descripcion\`     varchar(300)      DEFAULT NULL,
        \`anio_inicio\`     smallint unsigned DEFAULT NULL COMMENT 'Solo en secciones con usa_rango_anios = 1',
        \`anio_fin\`        smallint unsigned DEFAULT NULL COMMENT 'Nulo cuando es_actual = 1',
        \`es_actual\`       tinyint(1)        NOT NULL DEFAULT '0' COMMENT 'Época abierta: 2011 - Actualidad',
        \`orden\`           smallint unsigned DEFAULT NULL COMMENT 'Nulo en secciones con orden_automatico = 1',
        \`portada_foto_id\` int unsigned      DEFAULT NULL COMMENT 'Una de las fotos de esta misma colección',
        \`estado\`          enum('borrador','publicado') NOT NULL DEFAULT 'borrador',
        \`publicado_en\`    datetime          DEFAULT NULL,
        \`creado_en\`       timestamp         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`  timestamp         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`creado_por\`      int unsigned      DEFAULT NULL,
        \`actualizado_por\` int unsigned      DEFAULT NULL,
        \`eliminado_en\`    datetime          DEFAULT NULL,
        \`eliminado_por\`   int unsigned      DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_galeria_colecciones_seccion_slug\` (\`seccion_id\`,\`slug\`),
        KEY \`idx_galeria_colecciones_seccion_estado\` (\`seccion_id\`,\`estado\`,\`eliminado_en\`),
        KEY \`idx_galeria_colecciones_seccion_orden\` (\`seccion_id\`,\`orden\`),
        KEY \`idx_galeria_colecciones_seccion_anio\` (\`seccion_id\`,\`anio_inicio\`),
        KEY \`idx_galeria_colecciones_portada\` (\`portada_foto_id\`),
        CONSTRAINT \`fk_galeria_colecciones_seccion\`
          FOREIGN KEY (\`seccion_id\`) REFERENCES \`galeria_secciones\` (\`id\`),
        CONSTRAINT \`fk_galeria_colecciones_categoria\`
          FOREIGN KEY (\`categoria_id\`) REFERENCES \`galeria_categorias\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_galeria_colecciones_creado_por\`
          FOREIGN KEY (\`creado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_galeria_colecciones_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_galeria_colecciones_eliminado_por\`
          FOREIGN KEY (\`eliminado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`ck_galeria_colecciones_rango_anios\`
          CHECK (\`anio_inicio\` IS NULL OR \`anio_fin\` IS NULL OR \`anio_fin\` >= \`anio_inicio\`),
        CONSTRAINT \`ck_galeria_colecciones_es_actual\`
          CHECK (\`es_actual\` = 0 OR \`anio_fin\` IS NULL)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`galeria_fotos\` (
        \`id\`               int unsigned      NOT NULL AUTO_INCREMENT,
        \`coleccion_id\`     int unsigned      NOT NULL,
        \`archivo\`          varchar(160)      NOT NULL COMMENT 'Nombre generado por el servidor, sin ruta ni carpeta de variante',
        \`archivo_original\` varchar(255)      DEFAULT NULL COMMENT 'Nombre con el que se subió; alimenta el pie sugerido',
        \`pie\`              varchar(200)      DEFAULT NULL COMMENT 'Opcional: solo las fotos que lo ameriten',
        \`anio\`             smallint unsigned DEFAULT NULL,
        \`ancho\`            smallint unsigned DEFAULT NULL,
        \`alto\`             smallint unsigned DEFAULT NULL,
        \`peso_bytes\`       int unsigned      DEFAULT NULL,
        \`orden\`            smallint unsigned NOT NULL DEFAULT '0',
        \`creado_en\`        timestamp         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\`   timestamp         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`creado_por\`       int unsigned      DEFAULT NULL,
        \`actualizado_por\`  int unsigned      DEFAULT NULL,
        \`eliminado_en\`     datetime          DEFAULT NULL,
        \`eliminado_por\`    int unsigned      DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_galeria_fotos_archivo\` (\`archivo\`),
        KEY \`idx_galeria_fotos_coleccion_orden\` (\`coleccion_id\`,\`orden\`),
        KEY \`idx_galeria_fotos_coleccion_activas\` (\`coleccion_id\`,\`eliminado_en\`),
        CONSTRAINT \`fk_galeria_fotos_coleccion\`
          FOREIGN KEY (\`coleccion_id\`) REFERENCES \`galeria_colecciones\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_galeria_fotos_creado_por\`
          FOREIGN KEY (\`creado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_galeria_fotos_actualizado_por\`
          FOREIGN KEY (\`actualizado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_galeria_fotos_eliminado_por\`
          FOREIGN KEY (\`eliminado_por\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

        await queryRunner.query(`
      ALTER TABLE \`galeria_colecciones\`
        ADD CONSTRAINT \`fk_galeria_colecciones_portada\`
        FOREIGN KEY (\`portada_foto_id\`) REFERENCES \`galeria_fotos\` (\`id\`) ON DELETE SET NULL
    `);

        // ---------- Semilla: secciones ----------

        await queryRunner.query(`
      INSERT INTO \`galeria_secciones\`
        (\`clave\`, \`slug\`, \`nombre\`, \`orden\`, \`orden_automatico\`, \`usa_rango_anios\`, \`usa_categorias\`) VALUES
        ('timeline',      'linea-del-tiempo', 'Línea del tiempo', 1, 1, 1, 0),
        ('albums',        'albumes',          'Álbumes',          2, 0, 1, 1),
        ('instalaciones', 'instalaciones',    'Instalaciones',    3, 0, 0, 1),
        ('estudiantes',   'estudiantes',      'Estudiantes',      4, 0, 0, 1)
    `);

        // ---------- Semilla: categorías ----------

        await queryRunner.query(`
      INSERT INTO \`galeria_categorias\` (\`seccion_id\`, \`slug\`, \`nombre\`, \`orden\`)
      SELECT s.\`id\`, c.\`slug\`, c.\`nombre\`, c.\`orden\`
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT 'historico'   AS \`slug\`, 'Histórico'   AS \`nombre\`, 1 AS \`orden\` UNION ALL
        SELECT 'eventos',          'Eventos',          2 UNION ALL
        SELECT 'estudiantil',      'Estudiantil',      3 UNION ALL
        SELECT 'deportivo',        'Deportivo',        4 UNION ALL
        SELECT 'infraestructura',  'Infraestructura',  5
      ) c
      WHERE s.\`clave\` = 'albums'
    `);

        await queryRunner.query(`
      INSERT INTO \`galeria_categorias\` (\`seccion_id\`, \`slug\`, \`nombre\`, \`orden\`)
      SELECT s.\`id\`, c.\`slug\`, c.\`nombre\`, c.\`orden\`
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT 'academicas'  AS \`slug\`, 'Académicas'  AS \`nombre\`, 1 AS \`orden\` UNION ALL
        SELECT 'laboratorios',     'Laboratorios',     2 UNION ALL
        SELECT 'deportivas',       'Deportivas',       3 UNION ALL
        SELECT 'administrativas',  'Administrativas',  4 UNION ALL
        SELECT 'servicios',        'Servicios',        5 UNION ALL
        SELECT 'areas-comunes',    'Áreas comunes',    6
      ) c
      WHERE s.\`clave\` = 'instalaciones'
    `);

        await queryRunner.query(`
      INSERT INTO \`galeria_categorias\` (\`seccion_id\`, \`slug\`, \`nombre\`, \`orden\`)
      SELECT s.\`id\`, c.\`slug\`, c.\`nombre\`, c.\`orden\`
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT 'campus'    AS \`slug\`, 'Campus'     AS \`nombre\`, 1 AS \`orden\` UNION ALL
        SELECT 'academico',      'Académico',      2 UNION ALL
        SELECT 'ceremonias',     'Ceremonias',     3 UNION ALL
        SELECT 'deportivo',      'Deportivo',      4 UNION ALL
        SELECT 'cultural',       'Cultural',       5 UNION ALL
        SELECT 'social',         'Social',         6
      ) c
      WHERE s.\`clave\` = 'estudiantes'
    `);

        // ---------- Semilla: colecciones ----------

        await queryRunner.query(`
      INSERT INTO \`galeria_colecciones\`
        (\`seccion_id\`, \`slug\`, \`titulo\`, \`subtitulo\`, \`descripcion\`,
         \`anio_inicio\`, \`anio_fin\`, \`es_actual\`, \`estado\`, \`publicado_en\`)
      SELECT s.\`id\`, d.\`slug\`, d.\`titulo\`, d.\`subtitulo\`, d.\`descripcion\`,
             d.\`anio_inicio\`, d.\`anio_fin\`, d.\`es_actual\`, 'publicado', NOW()
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT '1920-1950' AS \`slug\`, '1920 - 1950' AS \`titulo\`, 'Nuestros inicios' AS \`subtitulo\`,
               'Los primeros pasos del Instituto Tecnológico de Durango.' AS \`descripcion\`,
               1920 AS \`anio_inicio\`, 1950 AS \`anio_fin\`, 0 AS \`es_actual\`
        UNION ALL SELECT '1951-1980', '1951 - 1980', 'Crecimiento y formación',
               'Una época de expansión académica y desarrollo institucional.', 1951, 1980, 0
        UNION ALL SELECT '1981-2000', '1981 - 2000', 'Modernización',
               'Nuevas carreras, infraestructura y tecnología.', 1981, 2000, 0
        UNION ALL SELECT '2001-2010', '2001 - 2010', 'Innovación y tecnología',
               'Impulso a la investigación y al desarrollo tecnológico.', 2001, 2010, 0
        UNION ALL SELECT '2011-actualidad', '2011 - Actualidad', 'Hacia el futuro',
               'Formando líderes para un mundo en constante evolución.', 2011, NULL, 1
      ) d
      WHERE s.\`clave\` = 'timeline'
    `);

        await queryRunner.query(`
      INSERT INTO \`galeria_colecciones\`
        (\`seccion_id\`, \`categoria_id\`, \`slug\`, \`titulo\`, \`subtitulo\`, \`descripcion\`,
         \`anio_inicio\`, \`orden\`, \`estado\`, \`publicado_en\`)
      SELECT s.\`id\`, c.\`id\`, d.\`slug\`, d.\`titulo\`, d.\`periodo\`, d.\`descripcion\`,
             d.\`anio_inicio\`, d.\`orden\`, 'publicado', NOW()
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT 'nuestros-inicios' AS \`slug\`, 'Nuestros inicios' AS \`titulo\`, '1920 - 1950' AS \`periodo\`,
               'Las imágenes más antiguas que conservamos del Instituto Tecnológico de Durango.' AS \`descripcion\`,
               1920 AS \`anio_inicio\`, 'historico' AS \`categoria\`, 1 AS \`orden\`
        UNION ALL SELECT 'crecimiento-formacion', 'Crecimiento y formación', '1951 - 1980',
               'El periodo en que el ITD amplió su oferta educativa y su comunidad.', 1951, 'historico', 2
        UNION ALL SELECT 'modernizacion', 'Modernización', '1981 - 2000',
               'Obras, remodelaciones y equipamiento que transformaron el plantel.', 1981, 'infraestructura', 3
        UNION ALL SELECT 'innovacion-tecnologia', 'Innovación y tecnología', '2001 - 2010',
               'Proyectos, laboratorios y espacios dedicados al desarrollo tecnológico.', 2001, 'infraestructura', 4
        UNION ALL SELECT 'actualidad-itd', 'Actualidad ITD', '2011 - Hoy',
               'Cómo luce el Instituto Tecnológico de Durango en la actualidad.', 2011, 'infraestructura', 5
        UNION ALL SELECT 'eventos-institucionales', 'Eventos institucionales', '2010 - Hoy',
               'Ceremonias, aniversarios y actos oficiales del Tecnológico.', 2010, 'eventos', 6
        UNION ALL SELECT 'vida-estudiantil', 'Vida estudiantil', '2010 - Hoy',
               'La convivencia y las actividades cotidianas de nuestra comunidad.', 2010, 'estudiantil', 7
        UNION ALL SELECT 'actividades-deportivas', 'Actividades deportivas', '2005 - Hoy',
               'Equipos, competencias y jornadas deportivas del Tecnológico.', 2005, 'deportivo', 8
        UNION ALL SELECT 'ceremonias-graduaciones', 'Ceremonias y graduaciones', '2000 - Hoy',
               'Las ceremonias en que nuestras generaciones concluyen su formación.', 2000, 'eventos', 9
        UNION ALL SELECT 'visitas-convenios', 'Visitas y convenios', '2005 - Hoy',
               'Acuerdos, visitas y colaboraciones con otras instituciones y empresas.', 2005, 'eventos', 10
        UNION ALL SELECT 'talleres-capacitaciones', 'Talleres y capacitaciones', '2010 - Hoy',
               'Sesiones prácticas y cursos que complementan la formación académica.', 2010, 'estudiantil', 11
        UNION ALL SELECT 'infraestructura', 'Infraestructura', '1980 - Hoy',
               'Edificios, áreas y obras que conforman el plantel del ITD.', 1980, 'infraestructura', 12
      ) d
      JOIN \`galeria_categorias\` c ON c.\`seccion_id\` = s.\`id\` AND c.\`slug\` = d.\`categoria\`
      WHERE s.\`clave\` = 'albums'
    `);

        await queryRunner.query(`
      INSERT INTO \`galeria_colecciones\`
        (\`seccion_id\`, \`categoria_id\`, \`slug\`, \`titulo\`, \`descripcion\`,
         \`orden\`, \`estado\`, \`publicado_en\`)
      SELECT s.\`id\`, c.\`id\`, d.\`slug\`, d.\`titulo\`, d.\`descripcion\`,
             d.\`orden\`, 'publicado', NOW()
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT 'aulas' AS \`slug\`, 'Aulas' AS \`titulo\`,
               'Espacios equipados para una enseñanza moderna y colaborativa.' AS \`descripcion\`,
               'academicas' AS \`categoria\`, 1 AS \`orden\`
        UNION ALL SELECT 'centro-computo', 'Centro de Cómputo',
               'Laboratorios con tecnología de vanguardia y acceso a internet.', 'academicas', 2
        UNION ALL SELECT 'biblioteca', 'Biblioteca',
               'Acervo bibliográfico especializado y espacios de estudio.', 'servicios', 3
        UNION ALL SELECT 'laboratorios', 'Laboratorios',
               'Laboratorios especializados para la investigación y la práctica.', 'laboratorios', 4
        UNION ALL SELECT 'auditorio', 'Auditorio',
               'Espacio para conferencias, eventos y actividades institucionales.', 'areas-comunes', 5
        UNION ALL SELECT 'gimnasio', 'Gimnasio',
               'Instalaciones deportivas para el desarrollo físico y el bienestar.', 'deportivas', 6
        UNION ALL SELECT 'edificio-administrativo', 'Edificio Administrativo',
               'Centro de gestión y atención a la comunidad estudiantil.', 'administrativas', 7
        UNION ALL SELECT 'cafeteria', 'Cafetería',
               'Espacio de convivencia y alimentación para estudiantes y personal.', 'servicios', 8
        UNION ALL SELECT 'centro-innovacion', 'Centro de Innovación',
               'Espacio para el desarrollo de proyectos e innovación tecnológica.', 'laboratorios', 9
        UNION ALL SELECT 'areas-verdes', 'Áreas Verdes',
               'Espacios naturales para el descanso y la convivencia.', 'areas-comunes', 10
        UNION ALL SELECT 'estacionamiento', 'Estacionamiento',
               'Amplias áreas de estacionamiento para la comunidad ITD.', 'servicios', 11
        UNION ALL SELECT 'canchas-multiusos', 'Canchas Multiusos',
               'Espacios deportivos al aire libre para diversas actividades.', 'deportivas', 12
      ) d
      JOIN \`galeria_categorias\` c ON c.\`seccion_id\` = s.\`id\` AND c.\`slug\` = d.\`categoria\`
      WHERE s.\`clave\` = 'instalaciones'
    `);

        await queryRunner.query(`
      INSERT INTO \`galeria_colecciones\`
        (\`seccion_id\`, \`categoria_id\`, \`slug\`, \`titulo\`, \`subtitulo\`, \`descripcion\`,
         \`anio_inicio\`, \`orden\`, \`estado\`, \`publicado_en\`)
      SELECT s.\`id\`, c.\`id\`, d.\`slug\`, d.\`titulo\`, d.\`subtitulo\`, d.\`descripcion\`,
             d.\`anio\`, d.\`orden\`, 'publicado', NOW()
      FROM \`galeria_secciones\` s
      JOIN (
        SELECT 'vida-campus' AS \`slug\`, 'Vida en el campus' AS \`titulo\`, 'Convivencia diaria' AS \`subtitulo\`,
               'El día a día de quienes hacen del Tecnológico su segunda casa.' AS \`descripcion\`,
               2025 AS \`anio\`, 'campus' AS \`categoria\`, 1 AS \`orden\`
        UNION ALL SELECT 'proyectos-competencias', 'Proyectos y competencias', 'Talento en acción',
               'Prototipos, concursos y proyectos desarrollados por nuestra comunidad.', 2025, 'academico', 2
        UNION ALL SELECT 'graduaciones', 'Graduaciones', 'Fin de una etapa',
               'El momento en que nuestras generaciones cierran su paso por el ITD.', 2025, 'ceremonias', 3
        UNION ALL SELECT 'deportes-itd', 'Deportes ITD', 'Representativos del Tecnológico',
               'Equipos, entrenamientos y torneos que nos representan.', 2024, 'deportivo', 4
        UNION ALL SELECT 'ferias-exposiciones', 'Ferias y exposiciones', 'Muestras académicas',
               'Espacios donde nuestros estudiantes comparten lo que han construido.', 2024, 'academico', 5
        UNION ALL SELECT 'talleres-capacitaciones', 'Talleres y capacitaciones', 'Aprendizaje práctico',
               'Sesiones que complementan la formación dentro del aula.', 2024, 'academico', 6
        UNION ALL SELECT 'cultura-arte', 'Cultura y arte', 'Expresión estudiantil',
               'Danza, música y manifestaciones artísticas de nuestra comunidad.', 2024, 'cultural', 7
        UNION ALL SELECT 'voluntariado', 'Voluntariado', 'Compromiso con la comunidad',
               'Jornadas en que nuestros estudiantes devuelven algo a su entorno.', 2023, 'social', 8
      ) d
      JOIN \`galeria_categorias\` c ON c.\`seccion_id\` = s.\`id\` AND c.\`slug\` = d.\`categoria\`
      WHERE s.\`clave\` = 'estudiantes'
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // La portada se suelta primero: de lo contrario galeria_fotos
        // no se puede eliminar por la referencia mutua.
        await queryRunner.query(`
      ALTER TABLE \`galeria_colecciones\` DROP FOREIGN KEY \`fk_galeria_colecciones_portada\`
    `);
        await queryRunner.query(`DROP TABLE IF EXISTS \`galeria_fotos\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`galeria_colecciones\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`galeria_categorias\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`galeria_secciones\``);
    }
}