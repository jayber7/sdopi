import { Module } from '@nestjs/common';
import { EvidenciaController } from './evidencia.controller';
import { EvidenciaService } from './evidencia.service';
import { ExifExtractorService } from './services/exif-extractor.service';
import { GeoVerificationService } from './services/geo-verification.service';

@Module({
  controllers: [EvidenciaController],
  providers: [EvidenciaService, ExifExtractorService, GeoVerificationService],
  exports: [EvidenciaService],
})
export class EvidenciaModule {}
