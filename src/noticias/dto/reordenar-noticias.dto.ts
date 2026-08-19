import { ArrayUnique, IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class ReordenarNoticiasDto {
    @IsArray()
    @ArrayMinSize(5, { message: 'Debes enviar exactamente los 5 ids.' })
    @ArrayMaxSize(5, { message: 'Debes enviar exactamente los 5 ids.' })
    @ArrayUnique({ message: 'No se permiten ids repetidos.' })
    @IsInt({ each: true })
    ids: number[];
}