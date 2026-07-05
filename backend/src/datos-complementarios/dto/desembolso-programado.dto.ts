import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDesembolsoProgramadoDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  proyectoId!: number;

  @IsString()
  mes!: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  montoProgramado!: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
