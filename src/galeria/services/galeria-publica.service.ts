import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { GaleriaSeccion } from '../entities/galeria-seccion.entity';
import { GaleriaCategoria } from '../entities/galeria-categoria.entity';
import { GaleriaColeccion } from '../entities/galeria-coleccion.entity';
import { GaleriaFoto } from '../entities/galeria-foto.entity';
import { ImagenesService } from './imagenes.service';

/** Colección tal como la consume el sitio público. */
export interface ColeccionPublica {
    id: string;
    seccion: string;
    titulo: string;
    subtitulo: string | null;
    descripcion: string | null;
    categoria: { slug: string; nombre: string } | null;
    totalFotos: number;
    portada: { thumb: string; medium: string } | null;
}

/** Fotografía tal como la consume el sitio público. */
export interface FotoPublica {
    id: string;
    pie: string | null;
    anio: number | null;
    ancho: number | null;
    alto: number | null;
    thumb: string;
    medium: string;
    original: string;
}

/**
 * Lectura de la Galería para el sitio público.
 *
 * Solo expone colecciones publicadas y fotografías activas, y
 * entrega los datos con la forma que el frontend ya usa: el
 * subtítulo de cada sección se compone aquí, igual que antes lo
 * hacían los mapeos del servicio de Angular.
 */
@Injectable()
export class GaleriaPublicaService {
    constructor(
        @InjectRepository(GaleriaSeccion)
        private readonly seccionesRepo: Repository<GaleriaSeccion>,
        @InjectRepository(GaleriaCategoria)
        private readonly categoriasRepo: Repository<GaleriaCategoria>,
        @InjectRepository(GaleriaColeccion)
        private readonly coleccionesRepo: Repository<GaleriaColeccion>,
        @InjectRepository(GaleriaFoto)
        private readonly fotosRepo: Repository<GaleriaFoto>,
        private readonly imagenes: ImagenesService,
    ) { }

    /** Las cuatro secciones con sus indicadores de comportamiento. */
    async listarSecciones() {
        const secciones = await this.seccionesRepo.find({ order: { orden: 'ASC' } });
        return secciones.map((s) => ({
            clave: s.clave,
            slug: s.slug,
            nombre: s.nombre,
            ordenAutomatico: s.ordenAutomatico,
            usaRangoAnios: s.usaRangoAnios,
            usaCategorias: s.usaCategorias,
        }));
    }

    /** Categorías activas de una sección, para los chips del sitio. */
    async listarCategorias(seccionSlug: string) {
        const seccion = await this.obtenerSeccion(seccionSlug);
        const categorias = await this.categoriasRepo.find({
            where: { seccionId: seccion.id, activo: true },
            order: { orden: 'ASC' },
        });
        return categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }));
    }

    /** Colecciones publicadas de una sección, en su orden. */
    async listarColecciones(seccionSlug: string): Promise<ColeccionPublica[]> {
        const seccion = await this.obtenerSeccion(seccionSlug);

        const colecciones = await this.coleccionesRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.categoria', 'categoria')
            .leftJoinAndSelect('c.portada', 'portada')
            .loadRelationCountAndMap('c.totalFotos', 'c.fotos', 'foto', (sub) =>
                sub.andWhere('foto.eliminado_en IS NULL'),
            )
            .where('c.seccion_id = :seccionId', { seccionId: seccion.id })
            .andWhere('c.estado = :estado', { estado: 'publicado' })
            .orderBy(
                seccion.ordenAutomatico ? 'c.anio_inicio' : 'c.orden',
                'ASC',
            )
            .addOrderBy('c.id', 'ASC')
            .getMany();

        return colecciones.map((c) => this.aColeccionPublica(c, seccion));
    }

    /** Una colección publicada con todas sus fotografías. */
    async obtenerColeccion(seccionSlug: string, coleccionSlug: string) {
        const seccion = await this.obtenerSeccion(seccionSlug);

        const coleccion = await this.coleccionesRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.categoria', 'categoria')
            .leftJoinAndSelect('c.portada', 'portada')
            .where('c.seccion_id = :seccionId', { seccionId: seccion.id })
            .andWhere('c.slug = :slug', { slug: coleccionSlug })
            .andWhere('c.estado = :estado', { estado: 'publicado' })
            .getOne();

        if (!coleccion) {
            throw new NotFoundException(
                `No encontramos la colección "${coleccionSlug}".`,
            );
        }

        const fotos = await this.fotosRepo.find({
            where: { coleccionId: coleccion.id, eliminadoEn: IsNull() },
            order: { orden: 'ASC', id: 'ASC' },
        });

        return {
            ...this.aColeccionPublica(coleccion, seccion, fotos.length),
            fotos: fotos.map((f) => this.aFotoPublica(f)),
        };
    }

    /** Totales para el encabezado de la Galería. */
    async estadisticas() {
        const totalFotos = await this.fotosRepo
            .createQueryBuilder('f')
            .innerJoin('f.coleccion', 'c')
            .where('f.eliminado_en IS NULL')
            .andWhere('c.estado = :estado', { estado: 'publicado' })
            .getCount();

        return { totalFotos };
    }

    // ------------------------------------------------------------
    // Interno
    // ------------------------------------------------------------

    private async obtenerSeccion(slug: string): Promise<GaleriaSeccion> {
        const seccion = await this.seccionesRepo.findOne({ where: { slug } });
        if (!seccion) {
            throw new NotFoundException(`No existe la sección "${slug}".`);
        }
        return seccion;
    }

    /**
     * Compone la colección para el cliente.
     *
     * El subtítulo se resuelve según la sección: las instalaciones
     * muestran el nombre de su categoría, y el resto usa el subtítulo
     * capturado. Es la misma lógica que antes vivía en los mapeos del
     * servicio de Angular.
     */
    private aColeccionPublica(
        coleccion: GaleriaColeccion & { totalFotos?: number },
        seccion: GaleriaSeccion,
        totalFotos?: number,
    ): ColeccionPublica {
        const subtitulo =
            seccion.clave === 'instalaciones'
                ? (coleccion.categoria?.nombre ?? null)
                : coleccion.subtitulo;

        const portada = coleccion.portada
            ? {
                thumb: this.imagenes.urlDe(
                    coleccion.id,
                    coleccion.portada.archivo,
                    'thumb',
                ),
                medium: this.imagenes.urlDe(
                    coleccion.id,
                    coleccion.portada.archivo,
                    'medium',
                ),
            }
            : null;

        return {
            id: coleccion.slug,
            seccion: seccion.clave,
            titulo: coleccion.titulo,
            subtitulo,
            descripcion: coleccion.descripcion,
            categoria: coleccion.categoria
                ? { slug: coleccion.categoria.slug, nombre: coleccion.categoria.nombre }
                : null,
            totalFotos: totalFotos ?? coleccion.totalFotos ?? 0,
            portada,
        };
    }

    private aFotoPublica(foto: GaleriaFoto): FotoPublica {
        const urls = this.imagenes.urlsDe(foto.coleccionId, foto.archivo);
        return {
            id: String(foto.id),
            pie: foto.pie,
            anio: foto.anio,
            ancho: foto.ancho,
            alto: foto.alto,
            thumb: urls.thumb,
            medium: urls.medium,
            original: urls.original,
        };
    }
}