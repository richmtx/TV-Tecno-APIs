import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource que usa el CLI de TypeORM para correr migraciones.
 * Es independiente de la configuración de app.module.ts, pero lee
 * las mismas variables del .env para no duplicar credenciales.
 */
export default new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: 'Z',
    charset: 'utf8mb4',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    migrationsTableName: 'migraciones',
    synchronize: false,
});