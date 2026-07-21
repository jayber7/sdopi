'use client';

import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseNominatim } from '@/lib/osm-services';

// ponytail: fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ORURO_CENTER: [number, number] = [-17.983, -67.15];
const DEFAULT_ZOOM = 7;
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapPicker({
  lat,
  lng,
  onChange,
  onReverseGeocode,
}: {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
  onReverseGeocode?: (direccion: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [latInput, setLatInput] = useState(lat != null ? String(lat) : '');
  const [lngInput, setLngInput] = useState(lng != null ? String(lng) : '');

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(lat != null && lng != null ? [lat, lng] : ORURO_CENTER, lat != null ? 15 : DEFAULT_ZOOM);

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    mapRef.current = map;

    // Click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      setPosition(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker when lat/lng props change from parent
  useEffect(() => {
    if (lat != null && lng != null) {
      setLatInput(String(lat));
      setLngInput(String(lng));
      updateMarker(lat, lng);
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 13));
      }
    }
  }, [lat, lng]);

  function updateMarker(newLat: number, newLng: number) {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    } else {
      const marker = L.marker([newLat, newLng], { draggable: true }).addTo(mapRef.current);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPosition(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }
  }

  function setPosition(newLat: number, newLng: number) {
    const roundedLat = Math.round(newLat * 1000000) / 1000000;
    const roundedLng = Math.round(newLng * 1000000) / 1000000;
    setLatInput(String(roundedLat));
    setLngInput(String(roundedLng));
    updateMarker(roundedLat, roundedLng);
    onChange(roundedLat, roundedLng);
    onReverseGeocode?.(`${roundedLat}, ${roundedLng}`);

    // debounced reverse geocoding
    const timeoutId = setTimeout(async () => {
      const dir = await reverseNominatim(roundedLat, roundedLng);
      if (dir) onReverseGeocode?.(dir);
    }, 500);
    return () => clearTimeout(timeoutId);
  }

  function handleInputChange(field: 'lat' | 'lng', value: string) {
    if (field === 'lat') setLatInput(value);
    else setLngInput(value);

    const newLat = field === 'lat' ? parseFloat(value) : parseFloat(latInput);
    const newLng = field === 'lng' ? parseFloat(value) : parseFloat(lngInput);

    if (!isNaN(newLat) && !isNaN(newLng) && isFinite(newLat) && isFinite(newLng)) {
      updateMarker(newLat, newLng);
      if (mapRef.current) mapRef.current.setView([newLat, newLng], Math.max(mapRef.current.getZoom(), 13));
      onChange(newLat, newLng);
    }
  }

  return (
    <div className="space-y-2">
      {/* Map */}
      <div ref={containerRef} style={{ height: 300, borderRadius: 8, border: '1px solid var(--color-border)', zIndex: 1 }} />

      {/* Coordinate inputs */}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          Latitud
          <input
            type="number" step="any"
            placeholder="-17.983"
            value={latInput}
            onChange={(e) => handleInputChange('lat', e.target.value)}
            className="input input-sm mt-1"
          />
        </label>
        <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          Longitud
          <input
            type="number" step="any"
            placeholder="-67.15"
            value={lngInput}
            onChange={(e) => handleInputChange('lng', e.target.value)}
            className="input input-sm mt-1"
          />
        </label>
      </div>
    </div>
  );
}
