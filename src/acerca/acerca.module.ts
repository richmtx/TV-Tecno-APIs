import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcercaContenido } from './entities/acerca-contenido.entity';
import { AcercaItem } from './entities/acerca-item.entity';
import { AcercaImagen } from './entities/acerca-imagen.entity';
import { AcercaService } from './services/acerca.service';
import { AcercaImagenesService } from './services/acerca-imagenes.service';
import { AcercaPublicaController } from './controllers/acerca-publica.controller';
import { AcercaAdminController } from './controllers/acerca-admin.controller';

/** Módulo del contenido administrable de "Acerca de". */
@Module({
    imports: [
        TypeOrmModule.forFeature([AcercaContenido, AcercaItem, AcercaImagen]),
    ],
    controllers: [AcercaPublicaController, AcercaAdminController],
    providers: [AcercaService, AcercaImagenesService],
    exports: [AcercaService],
})
export class AcercaModule { }