import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateVideoDto } from './create-video.dto';

export class UpdateVideoDto extends PartialType(
    OmitType(CreateVideoDto, ['fuente'] as const),
) { }