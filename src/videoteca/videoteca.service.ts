import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './videoteca.entity';
import { CategoriaVideo } from './categoria-video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { FiltrarVideosDto } from './dto/filtrar-videos.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class VideotecaService {
    constructor(
        @InjectRepository(Video)
        private readonly repo: Repository<Video>,
        @InjectRepository(CategoriaVideo)
        private readonly categoriasRepo: Repository<CategoriaVideo>,
    ) { }

    /** Extrae el ID de YouTube de una URL completa, o devuelve el valor tal cual. */
    private extraerIdYoutube(valor: string): string {
        const patron = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/;
        const match = valor.match(patron);
        return match ? match[1] : valor.trim();
    }

    /** Categorías con su conteo de videos publicados (barra lateral). */
    async listarCategorias() {
        const filas = await this.categoriasRepo
            .createQueryBuilder('c')
            .leftJoin('c.videos', 'v', 'v.publicado = 1')
            .select(['c.id AS id', 'c.nombre AS nombre', 'c.slug AS slug', 'c.icono AS icono'])
            .addSelect('COUNT(v.id)', 'total')
            .groupBy('c.id')
            .orderBy('c.orden', 'ASC')
            .getRawMany();

        const total = filas.reduce((suma, f) => suma + Number(f.total), 0);
        return {
            total,
            categorias: filas.map((f) => ({ ...f, total: Number(f.total) })),
        };
    }

    /** Listado público con filtros, búsqueda y paginación. */
    async findAll(filtros: FiltrarVideosDto) {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 12;

        const qb = this.repo
            .createQueryBuilder('v')
            .innerJoinAndSelect('v.categoria', 'c')
            .where('v.publicado = :publicado', { publicado: true });

        if (filtros.categoria) {
            qb.andWhere('c.slug = :slug', { slug: filtros.categoria });
        }

        if (filtros.busqueda) {
            qb.andWhere('(v.titulo LIKE :q OR v.descripcion LIKE :q)', {
                q: `%${filtros.busqueda}%`,
            });
        }

        // Filtro por periodo, calculado en SQL para respetar la zona del servidor
        const periodos: Record<string, string> = {
            hoy: 'v.fecha_publicacion = CURDATE()',
            semana: 'v.fecha_publicacion >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
            mes: 'v.fecha_publicacion >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)',
            anio: 'v.fecha_publicacion >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)',
        };
        if (filtros.periodo) {
            qb.andWhere(periodos[filtros.periodo]);
        }

        switch (filtros.orden) {
            case 'antiguos':
                qb.orderBy('v.fechaPublicacion', 'ASC');
                break;
            case 'vistos':
                qb.orderBy('v.vistas', 'DESC');
                break;
            default:
                qb.orderBy('v.fechaPublicacion', 'DESC');
        }
        qb.addOrderBy('v.id', 'DESC'); // desempate estable

        qb.skip((pagina - 1) * limite).take(limite);

        const [datos, total] = await qb.getManyAndCount();

        return {
            datos,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async findOne(id: number): Promise<Video> {
        const video = await this.repo.findOne({
            where: { id },
            relations: ['categoria', 'usuarioCreo', 'usuarioActualizo'],
        });
        if (!video) {
            throw new NotFoundException(`No existe el video con id ${id}`);
        }
        return video;
    }

    async create(dto: CreateVideoDto, usuarioId: number): Promise<Video> {
        const categoria = await this.categoriasRepo.findOneBy({ id: dto.categoriaId });
        if (!categoria) {
            throw new BadRequestException('La categoría indicada no existe.');
        }

        if (dto.fuente === 'youtube') {
            if (!dto.videoUrl) {
                throw new BadRequestException('Para fuente youtube debes enviar videoUrl.');
            }
            dto.videoUrl = this.extraerIdYoutube(dto.videoUrl);
        }

        const video = this.repo.create({
            ...dto,
            // Para fuente local, videoUrl se llena después con el endpoint de archivo
            videoUrl: dto.fuente === 'local' ? '' : dto.videoUrl,
            creadoPor: usuarioId,
            actualizadoPor: usuarioId,
        });

        return this.repo.save(video);
    }

    async update(id: number, dto: UpdateVideoDto, usuarioId: number): Promise<Video> {
        const video = await this.findOne(id);

        if (dto.categoriaId && dto.categoriaId !== video.categoriaId) {
            const existe = await this.categoriasRepo.findOneBy({ id: dto.categoriaId });
            if (!existe) {
                throw new BadRequestException('La categoría indicada no existe.');
            }
        }

        if (dto.videoUrl && video.fuente === 'youtube') {
            dto.videoUrl = this.extraerIdYoutube(dto.videoUrl);
        }

        Object.assign(video, dto);
        video.actualizadoPor = usuarioId;
        return this.repo.save(video);
    }

    /** Elimina el registro y sus archivos locales del disco. */
    async remove(id: number): Promise<{ mensaje: string }> {
        const video = await this.findOne(id);
        const archivos = [
            video.fuente === 'local' ? video.videoUrl : null,
            video.miniaturaUrl,
        ].filter((ruta): ruta is string => Boolean(ruta));

        await this.repo.remove(video);

        for (const ruta of archivos) {
            await unlink(join(process.cwd(), ruta)).catch(() => { });
        }

        return { mensaje: 'Video eliminado correctamente.' };
    }

    /** Asocia el archivo de video subido (solo fuente local). */
    async guardarArchivoVideo(
        id: number,
        nombreArchivo: string,
        usuarioId: number,
    ): Promise<Video> {
        const video = await this.findOne(id);

        if (video.fuente !== 'local') {
            throw new BadRequestException(
                'Este video es de YouTube. Solo los videos de fuente local aceptan archivos.',
            );
        }

        const anterior = video.videoUrl;
        video.videoUrl = `/uploads/videoteca/${nombreArchivo}`;
        video.actualizadoPor = usuarioId;
        const guardado = await this.repo.save(video);

        if (anterior) {
            await unlink(join(process.cwd(), anterior)).catch(() => { });
        }
        return guardado;
    }

    async guardarMiniatura(
        id: number,
        nombreArchivo: string,
        usuarioId: number,
    ): Promise<Video> {
        const video = await this.findOne(id);
        const anterior = video.miniaturaUrl;

        video.miniaturaUrl = `/uploads/videoteca/miniaturas/${nombreArchivo}`;
        video.actualizadoPor = usuarioId;
        const guardado = await this.repo.save(video);

        if (anterior) {
            await unlink(join(process.cwd(), anterior)).catch(() => { });
        }
        return guardado;
    }

    /**
     * Incremento atómico. No se usa save() para evitar sobrescribir
     * el contador si dos personas ven el video al mismo tiempo.
     */
    async registrarVista(id: number): Promise<{ vistas: number }> {
        const resultado = await this.repo.increment({ id }, 'vistas', 1);
        if (!resultado.affected) {
            throw new NotFoundException(`No existe el video con id ${id}`);
        }
        const video = await this.repo.findOneBy({ id });
        return { vistas: video!.vistas };
    }
}