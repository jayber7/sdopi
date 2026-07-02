import { Injectable } from '@nestjs/common';

export interface GeoVerificationResult {
  estado: 'VERIFICADO' | 'SOSPECHOSO' | 'PENDIENTE';
  distancia: number | null;
  radio: number;
  fuente: 'exif' | 'browser' | null;
  observaciones: string;
}

function haversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number },
): number {
  const R = 6371e3;
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class GeoVerificationService {
  verify(opts: {
    exifLat?: number | null;
    exifLng?: number | null;
    browserGpsLat?: number | null;
    browserGpsLng?: number | null;
    proyectoLat: number;
    proyectoLng: number;
    radio: number;
  }): GeoVerificationResult {
    const { exifLat, exifLng, browserGpsLat, browserGpsLng, proyectoLat, proyectoLng, radio } = opts;

    // Primary: EXIF GPS
    if (exifLat != null && exifLng != null) {
      const distancia = haversineDistance(
        { lat: exifLat, lng: exifLng },
        { lat: proyectoLat, lng: proyectoLng },
      );
      const estado = distancia <= radio ? 'VERIFICADO' : 'SOSPECHOSO' as const;
      return {
        estado,
        distancia: Math.round(distancia),
        radio,
        fuente: 'exif',
        observaciones:
          distancia <= radio
            ? `GPS de la fotografía dentro del radio de ${radio}m (distancia: ${Math.round(distancia)}m)`
            : `GPS de la fotografía fuera del radio de ${radio}m (distancia: ${Math.round(distancia)}m)`,
      };
    }

    // Fallback: browser GPS
    if (browserGpsLat != null && browserGpsLng != null) {
      const distancia = haversineDistance(
        { lat: browserGpsLat, lng: browserGpsLng },
        { lat: proyectoLat, lng: proyectoLng },
      );
      const estado = distancia <= radio ? 'VERIFICADO' : 'SOSPECHOSO' as const;
      return {
        estado,
        distancia: Math.round(distancia),
        radio,
        fuente: 'browser',
        observaciones:
          distancia <= radio
            ? `GPS del navegador dentro del radio de ${radio}m (distancia: ${Math.round(distancia)}m)`
            : `GPS del navegador fuera del radio de ${radio}m (distancia: ${Math.round(distancia)}m)`,
      };
    }

    // No GPS available
    return {
      estado: 'PENDIENTE',
      distancia: null,
      radio,
      fuente: null,
      observaciones: 'Sin datos de geolocalización en la foto ni en el navegador',
    };
  }
}
