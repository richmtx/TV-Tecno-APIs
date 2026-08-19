import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Noticia } from './noticias.entity';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { ReordenarNoticiasDto } from './dto/reordenar-noticias.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class NoticiasService {
    constructor(
        @InjectRepository(Noticia)
        private readonly repo: Repository<Noticia>,
        private readonly dataSource: DataSource,
    ) { }

    /** Listado público: orden 1 = destacada (panel grande). */
    findAll(): Promise<Noticia[]> {
        return this.repo.find({ order: { orden: 'ASC' } });
    }

    async findOne(id: number): Promise<Noticia> {
        const noticia = await this.repo.findOne({
            where: { id },
            relations: ['usuarioActualizo'],
        });
        if (!noticia) {
            throw new NotFoundException(`No existe la noticia con id ${id}`);
        }
        return noticia;
    }

    async update(id: number, dto: UpdateNoticiaDto, usuarioId: number): Promise<Noticia> {
        const noticia = await this.findOne(id);
        Object.assign(noticia, dto);
        noticia.actualizadoPor = usuarioId;
        return this.repo.save(noticia);
    }

    /**
     * Reordena las 5 noticias. El primer id del arreglo pasa a ser la destacada.
     * Offset temporal por el índice UNIQUE en `orden`.
     */
    async reordenar(dto: ReordenarNoticiasDto, usuarioId: number): Promise<Noticia[]> {
        const existentes = await this.repo.find({ where: { id: In(dto.ids) } });
        if (existentes.length !== 5) {
            throw new BadRequestException('Alguno de los ids enviados no existe.');
        }

        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(Noticia);
            for (const [i, id] of dto.ids.entries()) {
                await repo.update(id, { orden: 100 + i });
            }
            for (const [i, id] of dto.ids.entries()) {
                await repo.update(id, { orden: i + 1, actualizadoPor: usuarioId });
            }
        });

        return this.findAll();
    }

    async actualizarImagen(id: number, nombreArchivo: string, usuarioId: number): Promise<Noticia> {
        const noticia = await this.findOne(id);
        const anterior = noticia.imagenUrl;

        noticia.imagenUrl = `/uploads/noticias/${nombreArchivo}`;
        noticia.actualizadoPor = usuarioId;
        const guardada = await this.repo.save(noticia);

        if (anterior) {
            await unlink(join(process.cwd(), anterior)).catch(() => { });
        }
        return guardada;
    }
}