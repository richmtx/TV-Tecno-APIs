import { Controller, Get, Param } from '@nestjs/common';
import { GaleriaPublicaService } from '../services/galeria-publica.service';

/**
 * Rutas que consume el sitio público.
 * Solo lectura y sin autenticación: exponen exclusivamente
 * colecciones publicadas y fotografías activas.
 */
@Controller('galeria')
export class GaleriaPublicaController {
    constructor(private readonly galeria: GaleriaPublicaService) { }

    @Get('secciones')
    listarSecciones() {
        return this.galeria.listarSecciones();
    }

    @Get('estadisticas')
    estadisticas() {
        return this.galeria.estadisticas();
    }

    @Get(':seccion/categorias')
    listarCategorias(@Param('seccion') seccion: string) {
        return this.galeria.listarCategorias(seccion);
    }

    @Get(':seccion')
    listarColecciones(@Param('seccion') seccion: string) {
        return this.galeria.listarColecciones(seccion);
    }

    @Get(':seccion/:coleccion')
    obtenerColeccion(
        @Param('seccion') seccion: string,
        @Param('coleccion') coleccion: string,
    ) {
        return this.galeria.obtenerColeccion(seccion, coleccion);
    }
}