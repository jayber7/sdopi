import { IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMultaDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  planillaId!: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  monto!: number;

  @IsString()
  descripcion!: string;

  @IsDateString()
  fecha!: string;
}

export class QueryMultaDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  planillaId?: number;
}
