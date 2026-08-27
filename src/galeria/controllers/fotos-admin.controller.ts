import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req,
    UploadedFiles, UseGuards, UseInterceptors, } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FotosService } from '../services/fotos.service';
import { ActualizarFotoDto } from '../dto/actualizar-foto.dto';
import { AsignarAnioLoteDto, EliminarLoteDto } from '../dto/lote-fotos.dto';
import { ReordenarFotosDto } from '../dto/reordenar-fotos.dto';
import { galeriaUploadOptions } from '../galeria-upload.config';
import { ARCHIVOS_MAXIMOS } from '../galeria.constants';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '../../auth/enums/rol.enum';

/**
 * Gestión de fotografías desde el panel.
 * Editor y administrador suben y editan; solo el administrador
 * elimina.
 */
@Controller('admin/galeria/colecciones/:coleccionId/fotos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FotosAdminController {
    constructor(private readonly fotos: FotosService) { }

    @Get()
    @Roles(Rol.ADMIN, Rol.EDITOR)
    listar(@Param('coleccionId', ParseIntPipe) coleccionId: number) {
        return this.fotos.listarDeColeccion(coleccionId);
    }

    /**
     * Subida múltiple.
     * Responde con las guardadas y las fallidas por separado, para
     * que el panel muestre el resultado y permita reintentar.
     */
    @Post()
    @Roles(Rol.ADMIN, Rol.EDITOR)
    @UseInterceptors(
        FilesInterceptor('archivos', ARCHIVOS_MAXIMOS, galeriaUploadOptions),
    )
    subir(
        @Param('coleccionId', ParseIntPipe) coleccionId: number,
        @UploadedFiles() archivos: Express.Multer.File[],
        @Req() req: any,
    ) {
        return this.fotos.subir(coleccionId, archivos, req.user.id);
    }

    @Patch('anio')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    asignarAnio(
        @Param('coleccionId', ParseIntPipe) coleccionId: number,
        @Body() dto: AsignarAnioLoteDto,
        @Req() req: any,
    ) {
        return this.fotos.asignarAnioEnLote(coleccionId, dto, req.user.id);
    }

    @Patch('reordenar')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    reordenar(
        @Param('coleccionId', ParseIntPipe) coleccionId: number,
        @Body() dto: ReordenarFotosDto,
        @Req() req: any,
    ) {
        return this.fotos.reordenar(coleccionId, dto, req.user.id);
    }

    @Patch(':id')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    actualizar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ActualizarFotoDto,
        @Req() req: any,
    ) {
        return this.fotos.actualizar(id, dto, req.user.id);
    }

    /** Envía varias fotografías a la papelera. */
    @Delete('lote')
    @Roles(Rol.ADMIN)
    eliminarLote(
        @Param('coleccionId', ParseIntPipe) coleccionId: number,
        @Body() dto: EliminarLoteDto,
        @Req() req: any,
    ) {
        return this.fotos.eliminarEnLote(coleccionId, dto, req.user.id);
    }

    @Delete(':id')
    @Roles(Rol.ADMIN)
    eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.fotos.eliminar(id, req.user.id);
    }
}