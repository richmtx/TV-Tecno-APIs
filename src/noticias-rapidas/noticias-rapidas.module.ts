import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticiasRapidasController } from './noticias-rapidas.controller';
import { NoticiasRapidasService } from './noticias-rapidas.service';
import { NoticiaRapida } from './noticias-rapidas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NoticiaRapida])],
  controllers: [NoticiasRapidasController],
  providers: [NoticiasRapidasService],
})
export class NoticiasRapidasModule { }