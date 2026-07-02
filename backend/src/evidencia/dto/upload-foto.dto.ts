import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UploadFotoDto {
  @IsOptional()
  @IsString()
  categoria?: string = 'VISTA_GENERAL';

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  radio?: number;

  @IsOptional()
  @IsNumber()
  browserGpsLat?: number;

  @IsOptional()
  @IsNumber()
  browserGpsLng?: number;
}

export class RechazarEvidenciaDto {
  @IsString()
  observaciones!: string;
}
