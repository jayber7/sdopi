import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateFotoDto {
  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsString()
  categoria?: string;
}
