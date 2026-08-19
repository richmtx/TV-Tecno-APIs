import {
    Controller, Get, Post, Patch, Delete, Param, Body, Query,
    ParseIntPipe, UseGuards, Req, UseInterceptors, UploadedFile,
    BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VideotecaService } from './videoteca.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { FiltrarVideosDto } from './dto/filtrar-videos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../auth/enums/rol.enum';

const nombreUnico = (_req: any, file: Express.Multer.File, cb: Function) => {
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unico}${extname(file.originalname).toLowerCase()}`);
};

@Controller('videoteca')
export class VideotecaController {
    constructor(private readonly service: VideotecaService) { }

    /** Público: barra lateral con conteos por categoría. */
    @Get('categorias')
    listarCategorias() {
        return this.service.listarCategorias();
    }

    /** Público: grid de videos con filtros y paginación. */
    @Get()
    findAll(@Query() filtros: FiltrarVideosDto) {
        return this.service.findAll(filtros);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    /** Público: se llama desde el reproductor al iniciar la reproducción. */
    @Post(':id/vista')
    @HttpCode(HttpStatus.OK)
    registrarVista(@Param('id', ParseIntPipe) id: number) {
        return this.service.registrarVista(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    create(@Body() dto: CreateVideoDto, @Req() req: any) {
        return this.service.create(dto, req.user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateVideoDto,
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

    /** Sube el archivo de video (solo para fuente local). */
    @Patch(':id/archivo')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    @UseInterceptors(
        FileInterceptor('video', {
            storage: diskStorage({
                destination: './uploads/videoteca',
                filename: nombreUnico,
            }),
            limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
            fileFilter: (_req, file, cb) => {
                const permitidos = ['video/mp4', 'video/webm', 'video/quicktime'];
                cb(null, permitidos.includes(file.mimetype));
            },
        }),
    )
    subirArchivo(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() video: Express.Multer.File,
        @Req() req: any,
    ) {
        if (!video) {
            throw new BadRequestException('Archivo inválido. Solo MP4, WEBM o MOV hasta 500 MB.');
        }
        return this.service.guardarArchivoVideo(id, video.filename, req.user.id);
    }

    @Patch(':id/miniatura')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    @UseInterceptors(
        FileInterceptor('miniatura', {
            storage: diskStorage({
                destination: './uploads/videoteca/miniaturas',
                filename: nombreUnico,
            }),
            limits: { fileSize: 3 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
                cb(null, permitidos.includes(file.mimetype));
            },
        }),
    )
    subirMiniatura(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() miniatura: Express.Multer.File,
        @Req() req: any,
    ) {
        if (!miniatura) {
            throw new BadRequestException('Archivo inválido. Solo JPG, PNG o WEBP hasta 3 MB.');
        }
        return this.service.guardarMiniatura(id, miniatura.filename, req.user.id);
    }
}