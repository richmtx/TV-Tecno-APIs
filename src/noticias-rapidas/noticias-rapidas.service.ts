import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { NoticiaRapida } from './noticias-rapidas.entity';
import { CreateNoticiaRapidaDto } from './dto/create-noticia-rapida.dto';
import { UpdateNoticiaRapidaDto } from './dto/update-noticia-rapida.dto';
import { ReordenarNoticiasRapidasDto } from './dto/reordenar-noticias-rapidas.dto';

const MINIMO = 3;
const MAXIMO = 8;

@Injectable()
export class NoticiasRapidasService {
    constructor(
        @InjectRepository(NoticiaRapida)
        private readonly repo: Repository<NoticiaRapida>,
        private readonly dataSource: DataSource,
    ) { }

    /** Listado público: alimenta el ticker. */
    findAll(): Promise<NoticiaRapida[]> {
        return this.repo.find({ order: { orden: 'ASC', id: 'ASC' } });
    }

    async findOne(id: number): Promise<NoticiaRapida> {
        const noticia = await this.repo.findOne({
            where: { id },
            relations: ['usuarioActualizo'],
        });
        if (!noticia) {
            throw new NotFoundException(`No existe la noticia rápida con id ${id}`);
        }
        return noticia;
    }

    /**
     * Crea al final de la lista, dentro de una transacción para que el conteo
     * y la inserción no se separen (evita pasar de 8 con peticiones simultáneas).
     */
    async create(dto: CreateNoticiaRapidaDto, usuarioId: number): Promise<NoticiaRapida> {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(NoticiaRapida);
            const total = await repo.count();

            if (total >= MAXIMO) {
                throw new BadRequestException(
                    `No puedes agregar más de ${MAXIMO} noticias rápidas.`,
                );
            }

            const nueva = repo.create({
                texto: dto.texto,
                orden: total + 1,
                actualizadoPor: usuarioId,
            });
            return repo.save(nueva);
        });
    }

    async update(
        id: number,
        dto: UpdateNoticiaRapidaDto,
        usuarioId: number,
    ): Promise<NoticiaRapida> {
        const noticia = await this.findOne(id);
        Object.assign(noticia, dto);
        noticia.actualizadoPor = usuarioId;
        return this.repo.save(noticia);
    }

    /**
     * Elimina y reindexa el resto del 1 al N, para no dejar huecos en `orden`.
     */
    async remove(id: number): Promise<{ mensaje: string }> {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(NoticiaRapida);
            const total = await repo.count();

            if (total <= MINIMO) {
                throw new BadRequestException(
                    `Debe haber al menos ${MINIMO} noticias rápidas. Edita el texto en lugar de eliminarla.`,
                );
            }

            const noticia = await repo.findOneBy({ id });
            if (!noticia) {
                throw new NotFoundException(`No existe la noticia rápida con id ${id}`);
            }

            await repo.remove(noticia);

            // Reindexar las restantes
            const restantes = await repo.find({ order: { orden: 'ASC', id: 'ASC' } });
            for (const [i, item] of restantes.entries()) {
                await repo.update(item.id, { orden: i + 1 });
            }

            return { mensaje: 'Noticia rápida eliminada correctamente.' };
        });
    }

    /**
     * Reordena la lista completa. A diferencia de las otras tablas, aquí `orden`
     * no tiene UNIQUE, así que no hace falta el offset temporal.
     */
    async reordenar(
        dto: ReordenarNoticiasRapidasDto,
        usuarioId: number,
    ): Promise<NoticiaRapida[]> {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(NoticiaRapida);
            const total = await repo.count();

            if (dto.ids.length !== total) {
                throw new BadRequestException(
                    'Debes enviar todos los ids existentes en su nuevo orden.',
                );
            }

            const existentes = await repo.find({ where: { id: In(dto.ids) } });
            if (existentes.length !== dto.ids.length) {
                throw new BadRequestException('Alguno de los ids enviados no existe.');
            }

            for (const [i, id] of dto.ids.entries()) {
                await repo.update(id, { orden: i + 1, actualizadoPor: usuarioId });
            }

            return repo.find({ order: { orden: 'ASC', id: 'ASC' } });
        });
    }
}