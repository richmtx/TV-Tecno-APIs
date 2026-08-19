import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ProgramacionDestacadaModule } from './programacion-destacada/programacion-destacada.module';
import { NoticiasModule } from './noticias/noticias.module';
import { NoticiasRapidasModule } from './noticias-rapidas/noticias-rapidas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT') ?? '3306', 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        timezone: 'Z',
        charset: 'utf8mb4',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        maxAge: 86400000, // 1 día de caché en el navegador
      },
    }),

    UsuariosModule,
    AuthModule,
    ProgramacionDestacadaModule,
    NoticiasModule,
    NoticiasRapidasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }