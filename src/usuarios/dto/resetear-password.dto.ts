import { IsOptional, IsString, Length } from 'class-validator';

export class ResetearPasswordDto {
    @IsOptional()
    @IsString()
    @Length(8, 72)
    passwordNueva?: string;
}