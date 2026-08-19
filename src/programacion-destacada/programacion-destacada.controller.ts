import {
    Controller, Get, Patch, Param, Body, ParseIntPipe,
    UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProgramacionDestacadaService } from './programacion-destacada.service';
import { UpdateProgramacionDestacadaDto } from './dto/update-programacion-destacada.dto';
import { ReordenarProgramacionDto } from './dto/reordenar-programacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../auth/enums/rol.enum';

@Controller('programacion-destacada')
export class ProgramacionDestacadaController {
    constructor(private readonly service: ProgramacionDestacadaService) { }

    /** Público: alimenta el carrusel del sitio. */
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

    @Patch('reordenar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    reordenar(@Body() dto: ReordenarProgramacionDto, @Req() req: any) {
        return this.service.reordenar(dto, req.user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProgramacionDestacadaDto,
        @Req() req: any,
    ) {
        return this.service.update(id, dto, req.user.id);
    }

    @Patch(':id/imagen')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMIN, Rol.EDITOR)
    @UseInterceptors(
        FileInterceptor('imagen', {
            storage: diskStorage({
                destination: './uploads/programacion-destacada',
                filename: (_req, file, cb) => {
                    const unico = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                    cb(null, `${unico}${extname(file.originalname).toLowerCase()}`);
                },
            }),
            limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
            fileFilter: (_req, file, cb) => {
                const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
                cb(null, permitidos.includes(file.mimetype));
            },
        }),
    )
    subirImagen(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() imagen: Express.Multer.File,
        @Req() req: any,
    ) {
        if (!imagen) {
            throw new BadRequestException('Archivo inválido. Solo JPG, PNG o WEBP hasta 3 MB.');
        }
        return this.service.actualizarImagen(id, imagen.filename, req.user.id);
    }
}