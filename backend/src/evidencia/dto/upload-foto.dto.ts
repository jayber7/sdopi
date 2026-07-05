import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadFotoDto {
  @IsOptional()
  @IsString()
  categoria?: string = 'VISTA_GENERAL';

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  radio?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  browserGpsLat?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  browserGpsLng?: number;
}

export class RechazarEvidenciaDto {
  @IsString()
  observaciones!: string;
}
