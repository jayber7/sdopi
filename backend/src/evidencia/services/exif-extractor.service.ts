import { Injectable } from '@nestjs/common';
import * as exifr from 'exifr';
import { Readable } from 'stream';

export interface ExifData {
  latitud: number | null;
  longitud: number | null;
  altitud: number | null;
  fechaCaptura: Date | null;
  horaCaptura: string | null;
  dispositivo: string | null;
  modeloCamara: string | null;
  tieneGPS: boolean;
}

@Injectable()
export class ExifExtractorService {
  async extract(buffer: Buffer): Promise<ExifData | null> {
    try {
      const exif = await exifr.parse(buffer);

      if (!exif) return null;

      return {
        latitud: exif.latitude ?? null,
        longitud: exif.longitude ?? null,
        altitud: exif.altitude ?? null,
        fechaCaptura: exif.DateTimeOriginal || exif.CreateDate || null,
        horaCaptura: exif.DateTimeOriginal
          ? new Date(exif.DateTimeOriginal).toTimeString().split(' ')[0]
          : null,
        dispositivo: exif.Make || null,
        modeloCamara: exif.Model || null,
        tieneGPS: !!(exif.latitude && exif.longitude),
      };
    } catch {
      return null;
    }
  }
}
