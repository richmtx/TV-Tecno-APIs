import {
    Controller, Get, Post, Patch, Delete, Param, Body,
    ParseIntPipe, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NoticiasRapidasService } from './noticias-rapidas.service';
import { CreateNoticiaRapidaDto } from './dto/create-noticia-rapida.dto';
import { UpdateNoticiaRapidaDto } from './dto/update-noticia-rapida.dto';
import { ReordenarNoticiasRapidasDto } from './dto/reordenar-noticias-rapidas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../auth/enums/rol.enum';

@Controller('noticias-rapidas')
export class NoticiasRapidasController {
    constructor(private readonly service: NoticiasRapidasService) { }

    /** Público: alimenta el ticker del sitio. */
    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    create(@Body() dto: CreateNoticiaRapidaDto, @Req() req: any) {
        return this.service.create(dto, req.user.id);
    }

    @Patch('reordenar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    reordenar(@Body() dto: ReordenarNoticiasRapidasDto, @Req() req: any) {
        return this.service.reordenar(dto, req.user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateNoticiaRapidaDto,
        @Req() req: any,
    ) {
        return this.service.update(id, dto, req.user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN)
    @HttpCode(HttpStatus.OK)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}