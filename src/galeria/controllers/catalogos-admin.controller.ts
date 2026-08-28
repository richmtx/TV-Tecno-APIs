import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ColeccionesService } from '../services/colecciones.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '../../auth/enums/rol.enum';

/**
 * Catálogos de la Galería para el panel.
 * El endpoint público entrega solo slugs; aquí se exponen los
 * identificadores que los formularios necesitan.
 */
@Controller('admin/galeria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogosAdminController {
    constructor(private readonly colecciones: ColeccionesService) { }

    @Get('secciones')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    listarSecciones() {
        return this.colecciones.listarSecciones();
    }

    @Get('secciones/:id/categorias')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    listarCategorias(@Param('id', ParseIntPipe) id: number) {
        return this.colecciones.listarCategorias(id);
    }
}