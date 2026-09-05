import { Body, Controller, Get, Param, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AcercaService } from '../services/acerca.service';
import { ActualizarContenidoDto } from '../dto/actualizar-contenido.dto';
import { ActualizarItemDto } from '../dto/actualizar-item.dto';
import { ActualizarImagenDto } from '../dto/actualizar-imagen.dto';
import { acercaUploadOptions } from '../acerca-upload.config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UsuarioActual } from '../../auth/decorators/usuario-actual.decorator';
import type { UsuarioToken } from '../../auth/decorators/usuario-actual.decorator';
import { Rol } from '../../auth/enums/rol.enum';

/**
 * Edición del contenido de "Acerca de" desde el panel.
 *
 * Solo GET y PUT: la estructura de la página es fija y no se puede
 * agregar ni eliminar nada. Editor y administrador tienen los
 * mismos permisos aquí, porque no hay ninguna operación destructiva.
 *
 * Las rutas usan la `clave` y no el id: es el identificador estable
 * del hueco en la página y no depende del autoincremental.
 */
@Controller('admin/acerca')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcercaAdminController {
    constructor(private readonly acerca: AcercaService) { }

    // ------------------------------------------------------------
    // Prosa
    // ------------------------------------------------------------

    @Get('contenido')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    obtenerContenido() {
        return this.acerca.obtenerContenido();
    }

    @Put('contenido')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    actualizarContenido(
        @Body() dto: ActualizarContenidoDto,
        @UsuarioActual() usuario: UsuarioToken,
    ) {
        return this.acerca.actualizarContenido(dto, usuario.id);
    }

    // ------------------------------------------------------------
    // Valores, cobertura e indicadores
    // ------------------------------------------------------------

    @Get('items')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    listarItems() {
        return this.acerca.listarItems();
    }

    @Put('items/:clave')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    actualizarItem(
        @Param('clave') clave: string,
        @Body() dto: ActualizarItemDto,
        @UsuarioActual() usuario: UsuarioToken,
    ) {
        return this.acerca.actualizarItem(clave, dto, usuario.id);
    }

    // ------------------------------------------------------------
    // Imágenes
    // ------------------------------------------------------------

    @Get('imagenes')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    listarImagenes() {
        return this.acerca.listarImagenes();
    }

    /**
     * Reemplaza una imagen y sus textos en una sola petición.
     * El archivo es opcional: si el editor solo corrige la etiqueta,
     * no hace falta volver a subir la foto.
     */
    @Put('imagenes/:clave')
    @Roles(Rol.ADMIN, Rol.EDITOR)
    @UseInterceptors(FileInterceptor('archivo', acercaUploadOptions))
    actualizarImagen(
        @Param('clave') clave: string,
        @Body() dto: ActualizarImagenDto,
        @UploadedFile() archivo: Express.Multer.File | undefined,
        @UsuarioActual() usuario: UsuarioToken,
    ) {
        return this.acerca.actualizarImagen(clave, dto, archivo, usuario.id);
    }
}