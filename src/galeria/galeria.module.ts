import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GaleriaSeccion } from './entities/galeria-seccion.entity';
import { GaleriaCategoria } from './entities/galeria-categoria.entity';
import { GaleriaColeccion } from './entities/galeria-coleccion.entity';
import { GaleriaFoto } from './entities/galeria-foto.entity';
import { ImagenesService } from './services/imagenes.service';
import { ColeccionesService } from './services/colecciones.service';
import { FotosService } from './services/fotos.service';
import { GaleriaPublicaService } from './services/galeria-publica.service';
import { ColeccionesAdminController } from './controllers/colecciones-admin.controller';
import { FotosAdminController } from './controllers/fotos-admin.controller';
import { GaleriaPublicaController } from './controllers/galeria-publica.controller';
import { CatalogosAdminController } from './controllers/catalogos-admin.controller';
import { PurgaService } from './services/purga.service';

/** Módulo de la Galería ITD. */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            GaleriaSeccion,
            GaleriaCategoria,
            GaleriaColeccion,
            GaleriaFoto,
        ]),
    ],
    controllers: [
        CatalogosAdminController,
        ColeccionesAdminController,
        FotosAdminController,
        GaleriaPublicaController,
    ],
    providers: [
        ImagenesService,
        ColeccionesService,
        FotosService,
        GaleriaPublicaService,
        PurgaService,
    ],
    exports: [ImagenesService, ColeccionesService, FotosService],
})
export class GaleriaModule { }