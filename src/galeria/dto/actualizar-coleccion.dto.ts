import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CrearColeccionDto } from './crear-coleccion.dto';

/**
 * Datos para actualizar una colección.
 *
 * La sección no se puede cambiar: mover una instalación a álbumes
 * rompería su URL y su carpeta de imágenes sin ningún beneficio.
 *
 * El slug sí se puede editar aquí, a diferencia de la creación,
 * pero cambiarlo invalida los enlaces existentes.
 */
export class ActualizarColeccionDto extends PartialType(
    OmitType(CrearColeccionDto, ['seccionId'] as const),
) {
    @IsOptional()
    @IsString()
    @MaxLength(80)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'El slug solo admite minúsculas, números y guiones simples.',
    })
    slug?: string;
}