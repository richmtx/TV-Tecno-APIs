import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ColeccionesService } from './colecciones.service';
import { FotosService } from './fotos.service';

/** Días que el contenido permanece en la papelera. */
export const DIAS_EN_PAPELERA = 30;

/**
 * Vaciado automático de la papelera de la Galería.
 *
 * Corre de madrugada porque elimina archivos de disco y puede
 * tardar si hay muchas colecciones acumuladas; a esa hora nadie
 * está administrando contenido.
 *
 * Las colecciones se purgan antes que las fotografías sueltas: al
 * eliminar una colección, la base se lleva sus fotos en cascada, y
 * hacerlo al revés dejaría trabajo duplicado.
 */
@Injectable()
export class PurgaService {
    private readonly logger = new Logger(PurgaService.name);

    constructor(
        private readonly colecciones: ColeccionesService,
        private readonly fotos: FotosService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async vaciarPapelera(): Promise<void> {
        try {
            const colecciones = await this.colecciones.purgarAntiguas(DIAS_EN_PAPELERA);
            const fotos = await this.fotos.purgarAntiguas(DIAS_EN_PAPELERA);

            if (colecciones > 0 || fotos > 0) {
                this.logger.log(
                    `Papelera vaciada: ${colecciones} colecciones y ${fotos} fotografías eliminadas definitivamente.`,
                );
            }
        } catch (error) {
            this.logger.error('Falló el vaciado de la papelera.', error);
        }
    }
}