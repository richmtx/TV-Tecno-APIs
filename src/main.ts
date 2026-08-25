import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const origenes = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:4200,http://localhost:4300')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: origenes,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = config.get<string>('PORT') ?? 3000;
  await app.listen(port);

  console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
}
bootstrap();