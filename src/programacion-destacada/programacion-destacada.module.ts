import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramacionDestacadaController } from './programacion-destacada.controller';
import { ProgramacionDestacadaService } from './programacion-destacada.service';
import { ProgramacionDestacada } from './programacion-destacada.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramacionDestacada])],
  controllers: [ProgramacionDestacadaController],
  providers: [ProgramacionDestacadaService],
})
export class ProgramacionDestacadaModule { }