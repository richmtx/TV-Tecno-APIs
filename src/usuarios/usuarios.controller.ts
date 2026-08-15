import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import type { UsuarioToken } from '../auth/decorators/usuario-actual.decorator';
import { Rol } from '../auth/enums/rol.enum';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ResetearPasswordDto } from './dto/resetear-password.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    /** Disponible para admin y editor: cualquiera puede cambiar su propia contraseña. */
    @Patch('mi-password')
    @HttpCode(HttpStatus.OK)
    cambiarMiPassword(
        @UsuarioActual() actual: UsuarioToken,
        @Body() dto: CambiarPasswordDto,
    ) {
        return this.usuariosService.cambiarPassword(actual.id, dto);
    }

    @Get('estadisticas')
    @Roles(Rol.ADMIN)
    estadisticas() {
        return this.usuariosService.obtenerEstadisticas();
    }

    @Get()
    @Roles(Rol.ADMIN)
    listar(@Query() filtros: FiltrarUsuariosDto) {
        return this.usuariosService.listar(filtros);
    }

    @Get(':id')
    @Roles(Rol.ADMIN)
    obtenerUno(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.obtenerUno(id);
    }

    @Post()
    @Roles(Rol.ADMIN)
    crear(
        @Body() dto: CrearUsuarioDto,
        @UsuarioActual() actual: UsuarioToken,
    ) {
        return this.usuariosService.crear(dto, actual.id);
    }

    @Patch(':id')
    @Roles(Rol.ADMIN)
    actualizar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ActualizarUsuarioDto,
        @UsuarioActual() actual: UsuarioToken,
    ) {
        return this.usuariosService.actualizar(id, dto, actual.id);
    }

    @Patch(':id/reactivar')
    @Roles(Rol.ADMIN)
    reactivar(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.reactivar(id);
    }

    @Patch(':id/resetear-password')
    @Roles(Rol.ADMIN)
    resetearPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ResetearPasswordDto,
    ) {
        return this.usuariosService.resetearPassword(id, dto.passwordNueva);
    }

    @Delete(':id')
    @Roles(Rol.ADMIN)
    @HttpCode(HttpStatus.OK)
    eliminar(
        @Param('id', ParseIntPipe) id: number,
        @UsuarioActual() actual: UsuarioToken,
    ) {
        return this.usuariosService.eliminar(id, actual.id);
    }
}