import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TOTAL_DESTACADOS } from './programacion-destacada.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ProgramacionDestacada } from './programacion-destacada.entity';
import { UpdateProgramacionDestacadaDto } from './dto/update-programacion-destacada.dto';
import { ReordenarProgramacionDto } from './dto/reordenar-programacion.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProgramacionDestacadaService {
    constructor(
        @InjectRepository(ProgramacionDestacada)
        private readonly repo: Repository<ProgramacionDestacada>,
        private readonly dataSource: DataSource,
    ) { }

    /** Listado público: los 5 en orden de carrusel. */
    findAll(): Promise<ProgramacionDestacada[]> {
        return this.repo.find({ order: { orden: 'ASC' } });
    }

    async findOne(id: number): Promise<ProgramacionDestacada> {
        const registro = await this.repo.findOne({
            where: { id },
            relations: ['usuarioActualizo'],
        });
        if (!registro) {
            throw new NotFoundException(`No existe la programación con id ${id}`);
        }
        return registro;
    }

    async update(
        id: number,
        dto: UpdateProgramacionDestacadaDto,
        usuarioId: number,
    ): Promise<ProgramacionDestacada> {
        const registro = await this.findOne(id);
        Object.assign(registro, dto);
        registro.actualizadoPor = usuarioId;
        return this.repo.save(registro);
    }

    /**
   * Reordena los 5 registros dentro de una transacción.
   * Se usa un offset temporal porque `orden` tiene índice UNIQUE:
   * asignar directamente provocaría colisión a medio camino.
   */
    async reordenar(
        dto: ReordenarProgramacionDto,
        usuarioId: number,
    ): Promise<ProgramacionDestacada[]> {
        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(ProgramacionDestacada);

            const existentes = await repo.count({ where: { id: In(dto.ids) } });
            if (existentes !== TOTAL_DESTACADOS) {
                throw new BadRequestException('Alguno de los ids enviados no existe.');
            }

            // Paso 1: mover todos fuera del rango 1-5 para liberar el UNIQUE
            for (const [i, id] of dto.ids.entries()) {
                await repo.update(id, { orden: 100 + i });
            }
            // Paso 2: asignar el orden definitivo
            for (const [i, id] of dto.ids.entries()) {
                await repo.update(id, { orden: i + 1, actualizadoPor: usuarioId });
            }
        });

        return this.findAll();
    }

    /** Reemplaza la imagen y borra el archivo anterior del disco. */
    async actualizarImagen(
        id: number,
        nombreArchivo: string,
        usuarioId: number,
    ): Promise<ProgramacionDestacada> {
        const registro = await this.findOne(id);
        const anterior = registro.imagenUrl;

        registro.imagenUrl = `/uploads/programacion-destacada/${nombreArchivo}`;
        registro.actualizadoPor = usuarioId;
        const guardado = await this.repo.save(registro);

        if (anterior) {
            await unlink(join(process.cwd(), anterior)).catch(() => {
                // El archivo pudo haberse borrado manualmente; no es un error crítico.
            });
        }
        return guardado;
    }
}