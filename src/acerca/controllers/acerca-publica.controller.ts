import { Controller, Get } from '@nestjs/common';
import { AcercaService } from '../services/acerca.service';

/**
 * Contenido de "Acerca de" para el sitio público.
 * Una sola ruta: la página se arma con una petición.
 */
@Controller('acerca')
export class AcercaPublicaController {
    constructor(private readonly acerca: AcercaService) { }

    @Get()
    obtener() {
        return this.acerca.obtenerTodo();
    }
}