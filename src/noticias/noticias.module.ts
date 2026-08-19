import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';
import { Noticia } from './noticias.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Noticia])],
  controllers: [NoticiasController],
  providers: [NoticiasService],
})
export class NoticiasModule { }