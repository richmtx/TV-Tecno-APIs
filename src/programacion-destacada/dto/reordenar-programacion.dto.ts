import { ArrayUnique, IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { TOTAL_DESTACADOS } from '../programacion-destacada.constants';

export class ReordenarProgramacionDto {
    @IsArray()
    @ArrayMinSize(TOTAL_DESTACADOS, { message: `Debes enviar exactamente los ${TOTAL_DESTACADOS} ids.` })
    @ArrayMaxSize(TOTAL_DESTACADOS, { message: `Debes enviar exactamente los ${TOTAL_DESTACADOS} ids.` })
    @ArrayUnique({ message: 'No se permiten ids repetidos.' })
    @IsInt({ each: true })
    ids: number[];
}