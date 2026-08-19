import { ArrayUnique, IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class ReordenarNoticiasRapidasDto {
    @IsArray()
    @ArrayMinSize(3, { message: 'Debe haber al menos 3 noticias rápidas.' })
    @ArrayMaxSize(8, { message: 'No puede haber más de 8 noticias rápidas.' })
    @ArrayUnique({ message: 'No se permiten ids repetidos.' })
    @IsInt({ each: true })
    ids: number[];
}