'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { municipios, type Municipio, oruroCentro, ciudadOruro, estadoColor, estadoLabel } from '@/lib/municipios';
import { getMunicipiosPolygons, getViasOruro } from '@/lib/osm-services';
import MapControls from './MapControls';

const tileUrls: Record<string, string> = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  oscuro: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satelite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};

interface Props {
  selected: Municipio;
  filtroEstado: string;
  busqueda: string;
  counts: Record<string, number>;
  routeVisible: boolean;
  routeGeo: any;
  routeInfo: { nombre: string; provincia: string };
  onSelect: (m: Municipio) => void;
  onToggleRoute: () => void;
}

function escapeHTML(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
}

function limpiar(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function MapaOruro({ selected, filtroEstado, busqueda, counts, routeVisible, routeGeo, routeInfo, onSelect, onToggleRoute }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const tileLayer = useRef<L.TileLayer | null>(null);
  const polygonLayer = useRef<L.LayerGroup | null>(null);
  const selectedLayer = useRef<L.LayerGroup | null>(null);
  const roadLayer = useRef<L.LayerGroup | null>(null);

  const [baseLayer, setBaseLayer] = useState('osm');
  const [polygonsVisible, setPolygonsVisible] = useState(true);
  const polygonsVisibleRef = useRef(polygonsVisible);
  const [viasVisible, setViasVisible] = useState(false);
  const viasVisibleRef = useRef(viasVisible);

  useEffect(() => { polygonsVisibleRef.current = polygonsVisible; }, [polygonsVisible]);
  useEffect(() => { viasVisibleRef.current = viasVisible; }, [viasVisible]);

  const handleFullscreen = useCallback(() => {
    const el = mapInstance.current?.getContainer();
    if (el && !document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const handleCenterOruro = useCallback(() => {
    mapInstance.current?.setView([-18.55, -67.75], 7, { animate: true, duration: 0.75 });
  }, []);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true,
      attributionControl: false,
    }).setView(oruroCentro, 7);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    tileLayer.current = L.tileLayer(tileUrls.osm, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markerLayer.current = L.layerGroup().addTo(map);
    selectedLayer.current = L.layerGroup().addTo(map);

    getMunicipiosPolygons().then((geojson) => {
      if (!mapInstance.current || !geojson?.features?.length) return;
      const layer = L.layerGroup().addTo(mapInstance.current);
      geojson.features.forEach((f: any) => {
        if (!f.geometry) return;
        const matched = municipios.find(
          (m) =>
            limpiar(m.nombre).includes(limpiar(f.properties.name).split('-')[0]) ||
            limpiar(f.properties.name).includes(limpiar(m.nombre)),
        );
        const color = estadoColor[matched?.estado || 'normal'];
        L.geoJSON(f, {
          style: { color, weight: 1.5, opacity: 0.5, fillColor: color, fillOpacity: 0.03, dashArray: '6 4' },
        })
          .on('click', () => matched && onSelect(matched))
          .bindTooltip(matched ? `${matched.nombre} · ${matched.provincia}` : '', { permanent: false, direction: 'center', className: 'polygon-tooltip' })
          .addTo(layer);
      });
      polygonLayer.current = layer;
      if (!polygonsVisibleRef.current) layer.remove();
    });

    getViasOruro().then((geojson) => {
      if (!mapInstance.current || !geojson?.features?.length) return;
      const layer = L.layerGroup().addTo(mapInstance.current);
      geojson.features.forEach((f: any) => {
        const highway = f.properties?.highway || 'unknown';
        const style: Record<string, { color: string; weight: number; opacity: number }> = {
          motorway:  { color: '#cf1d1d', weight: 4, opacity: 0.85 },
          trunk:     { color: '#e08a3a', weight: 3.5, opacity: 0.85 },
          primary:   { color: '#f0c040', weight: 3, opacity: 0.75 },
          secondary: { color: '#6ab04c', weight: 2.5, opacity: 0.7 },
          tertiary:  { color: '#96b6c2', weight: 2, opacity: 0.6 },
        };
        const s = style[highway] || { color: '#94a3b8', weight: 1.5, opacity: 0.5 };
        const name = f.properties?.name || f.properties?.ref || '';
        L.geoJSON(f, {
          style: { color: s.color, weight: s.weight, opacity: s.opacity },
        })
          .bindTooltip(name, { permanent: false, direction: 'top', className: 'road-tooltip' })
          .addTo(layer);
      });
      roadLayer.current = layer;
      if (!viasVisibleRef.current) layer.remove();
    });

    map.whenReady(() => {
      const bounds = L.latLngBounds(municipios.map((m) => m.coords));
      map.fitBounds(bounds.pad(0.18), { animate: false });
    });

    mapInstance.current = map;

    // Handle popup button clicks (Leaflet renders outside React tree)
    const handler = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-id]') as HTMLElement;
      if (btn?.dataset?.id) {
        const m = municipios.find((m) => m.id === btn.dataset!.id);
        if (m) onSelect(m);
      }
    };
    document.addEventListener('click', handler);

    return () => {
      document.removeEventListener('click', handler);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  function visibles() {
    return municipios.filter((m) => {
      const estadoOk = filtroEstado === 'todos' || m.estado === filtroEstado;
      const texto = limpiar([m.nombre, m.provincia, m.unidad, m.descripcion, ...m.destacados.map((p) => `${p.titulo} ${p.detalle}`)].join(' '));
      const busquedaOk = !busqueda || texto.includes(limpiar(busqueda));
      return estadoOk && busquedaOk;
    });
  }

  useEffect(() => {
    const map = mapInstance.current;
    const ml = markerLayer.current;
    if (!map || !ml) return;

    map.closePopup();
    try { ml.clearLayers(); } catch {} // ponytail: stale layer on unmount
    visibles().forEach((m) => {
      const isActive = m.id === selected.id;
      const icon = L.divIcon({
        className: 'territory-map-marker',
        html: `<div class="map-pin ${m.estado}${isActive ? ' active' : ''}" data-label="${escapeHTML(m.nombre)}"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(m.coords, { icon, title: m.nombre, zIndexOffset: isActive ? 600 : 200 })
        .bindPopup(
          `<div class="oruro-popup">
            <div class="popup-title">${escapeHTML(m.nombre)}</div>
            <div class="popup-muted">${escapeHTML(m.provincia)} &bull; ${escapeHTML(m.unidad)}</div>
            <div class="popup-grid">
              <div class="popup-box"><strong>${counts[m.nombre] ?? 0}</strong><span>Proyectos</span></div>
              <div class="popup-box"><strong>${estadoLabel[m.estado]}</strong><span>Estado</span></div>
            </div>
            <button class="popup-action" type="button" data-id="${m.id}">Ver ficha</button>
          </div>`,
          { className: 'oruro-popup-shell' },
        )
        .on('click', () => onSelect(m))
        .addTo(ml);
    });
  }, [selected.id, filtroEstado, busqueda]);

  useEffect(() => {
    const map = mapInstance.current;
    const sl = selectedLayer.current;
    if (!map || !sl) return;

    map.closePopup();
    try { sl.clearLayers(); } catch {} // ponytail: stale layer on unmount

    L.circle(selected.coords, {
      radius: 18000,
      color: estadoColor[selected.estado],
      weight: 2,
      fillColor: estadoColor[selected.estado],
      fillOpacity: 0.04,
      dashArray: '6 8',
    }).addTo(sl);

    if (routeVisible && routeGeo) {
      L.geoJSON(routeGeo, {
        style: { color: '#6b7280', weight: 3, opacity: 0.5, dashArray: '12 8' },
      }).addTo(sl);
    } else if (routeVisible) {
      L.polyline([ciudadOruro, selected.coords], {
          color: '#6b7280', weight: 2.5, opacity: 0.5, dashArray: '8 10',
      }).addTo(sl);
    }

    map.flyTo(selected.coords, 10, { duration: 0.75 });
  }, [selected.id, routeVisible, routeGeo]);

  useEffect(() => {
    const map = mapInstance.current;
    const current = tileLayer.current;
    if (!map || !current) return;
    map.removeLayer(current);
    const url = tileUrls[baseLayer] || tileUrls.osm;
    const attrs: Record<string, string> = {
      osm: '&copy; OpenStreetMap contributors',
      oscuro: '&copy; <a href="https://carto.com/">CARTO</a>',
      satelite: '&copy; Esri',
      topo: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    };
    tileLayer.current = L.tileLayer(url, { maxZoom: 19, attribution: attrs[baseLayer] || '' }).addTo(map);
  }, [baseLayer]);

  useEffect(() => {
    const pl = polygonLayer.current;
    if (!pl) return;
    if (polygonsVisible) {
      mapInstance.current && pl.addTo(mapInstance.current);
    } else {
      mapInstance.current && pl.remove();
    }
  }, [polygonsVisible]);

  useEffect(() => {
    const rl = roadLayer.current;
    if (!rl) return;
    if (viasVisible) {
      mapInstance.current && rl.addTo(mapInstance.current);
    } else {
      mapInstance.current && rl.remove();
    }
  }, [viasVisible]);

  return (
    <div className="card overflow-hidden" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <MapControls
        baseLayer={baseLayer}
        polygonsVisible={polygonsVisible}
        routeVisible={routeVisible}
        viasVisible={viasVisible}
        onBaseLayerChange={setBaseLayer}
        onPolygonsToggle={() => setPolygonsVisible((v) => !v)}
        onToggleRoute={onToggleRoute}
        onViasToggle={() => setViasVisible((v) => !v)}
        onCenterOruro={handleCenterOruro}
        onFullscreen={handleFullscreen}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} className="real-map" style={{ position: 'absolute', inset: 0 }} />
        {routeVisible && (
          <div className="route-info-chip">{routeInfo.nombre} · {routeInfo.provincia}</div>
        )}
      </div>
      <div className="flex gap-3 px-4 py-2" style={{ borderTop: '1px solid var(--color-border-light)', alignItems: 'center' }}>
        {[
          { label: 'Ejecución normal', color: '#16a34a' },
          { label: 'Con observación', color: '#d8a21d' },
          { label: 'Alerta / retraso', color: '#ef4444' },
          { label: 'Concluido', color: '#2563eb' },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
            {l.label}
          </span>
        ))}
        {viasVisible && (
          <>
            <span style={{ width: 1, height: 14, background: 'var(--color-border-light)', display: 'inline-block' }} />
            {[
              { label: 'Autopista', color: '#cf1d1d', weight: 4 },
              { label: 'Troncal', color: '#e08a3a', weight: 3.5 },
              { label: 'Primaria', color: '#f0c040', weight: 3 },
              { label: 'Secundaria', color: '#6ab04c', weight: 2.5 },
              { label: 'Terciaria', color: '#96b6c2', weight: 2 },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                <span style={{ width: 14, height: 3, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                {l.label}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
