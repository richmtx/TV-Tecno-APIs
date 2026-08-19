import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideotecaController } from './videoteca.controller';
import { VideotecaService } from './videoteca.service';
import { Video } from './videoteca.entity';
import { CategoriaVideo } from './categoria-video.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Video, CategoriaVideo])],
  controllers: [VideotecaController],
  providers: [VideotecaService],
})
export class VideotecaModule { }