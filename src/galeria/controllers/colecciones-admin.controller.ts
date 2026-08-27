import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query,
    Req, UseGuards, } from '@nestjs/common';
import { ColeccionesService } from '../services/colecciones.service';
import { CrearColeccionDto } from '../dto/crear-coleccion.dto';
import { ActualizarColeccionDto } from '../dto/actualizar-coleccion.dto';
import { ReordenarColeccionesDto } from '../dto/reordenar-colecciones.dto';
import { ListarColeccionesDto } from '../dto/listar-colecciones.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '../../auth/enums/rol.enum';

/**
 * Gestión de colecciones desde el panel.
 * Editor y administrador crean, editan y publican; solo el
 * administrador elimina.
 */
@Controller('admin/galeria/colecciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColeccionesAdminController {
    constructor(private readonly colecciones: ColeccionesService) { }

    @Get()
    @Roles(Rol.ADMIN, Rol.EDITOR)
    listar(@Query() filtros: ListarColeccionesDto) {
        return this.colecciones.listar(filtros);
    }

    @Get(':id')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    obtener(@Param('id', ParseIntPipe) id: number) {
        return this.colecciones.obtener(id);
    }

    @Post()
    @Roles(Rol.ADMIN, Rol.EDITOR)
    crear(@Body() dto: CrearColeccionDto, @Req() req: any) {
        return this.colecciones.crear(dto, req.user.id);
    }

    /** Va antes de :id para que "reordenar" no se lea como un id. */
    @Patch('reordenar')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    reordenar(@Body() dto: ReordenarColeccionesDto, @Req() req: any) {
        return this.colecciones.reordenar(dto, req.user.id);
    }

    @Patch(':id')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    actualizar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ActualizarColeccionDto,
        @Req() req: any,
    ) {
        return this.colecciones.actualizar(id, dto, req.user.id);
    }

    @Patch(':id/publicar')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    publicar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.colecciones.publicar(id, req.user.id);
    }

    @Patch(':id/despublicar')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    despublicar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.colecciones.despublicar(id, req.user.id);
    }

    @Patch(':id/portada/:fotoId')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    definirPortada(
        @Param('id', ParseIntPipe) id: number,
        @Param('fotoId', ParseIntPipe) fotoId: number,
        @Req() req: any,
    ) {
        return this.colecciones.definirPortada(id, fotoId, req.user.id);
    }

    /** Envía la colección a la papelera. Solo el administrador. */
    @Delete(':id')
    @Roles(Rol.ADMIN)
    eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.colecciones.eliminar(id, req.user.id);
    }

    /** Elimina definitivamente la colección y sus archivos. */
    @Delete(':id/purgar')
    @Roles(Rol.ADMIN)
    purgar(@Param('id', ParseIntPipe) id: number) {
        return this.colecciones.purgar(id);
    }
}