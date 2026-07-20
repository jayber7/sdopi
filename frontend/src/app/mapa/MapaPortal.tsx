'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

import { municipios, type Municipio, ciudadOruro } from '@/lib/municipios';
import { getRoute } from '@/lib/osm-services';
import { useJefatura } from '@/context/JefaturaContext';
import MapaOruro from './MapaOruro';
import TerritoryPanel from './TerritoryPanel';
import ProjectList from './ProjectList';

export default function MapaPortal() {
  const [selected, setSelected] = useState<Municipio>(municipios[0]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [routeVisible, setRouteVisible] = useState(true);
  const [routeGeo, setRouteGeo] = useState<any>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const routeCache = useRef<Record<string, any>>({});
  const { jefatura } = useJefatura();

  useEffect(() => {
    fetch(`/api/proyectos/contar-por-municipio?jefatura=${jefatura}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const map: Record<string, number> = {};
        (Array.isArray(data) ? data : []).forEach((item: any) => {
          if (item.municipio) map[item.municipio] = item._count?.municipio ?? 0;
        });
        setCounts(map);
      })
      .catch(() => {});
  }, [jefatura]);

  const handleSelect = useCallback(async (m: Municipio) => {
    setSelected(m);
    if (m.nombre !== 'Oruro' && routeVisible) {
      if (routeCache.current[m.id]) {
        setRouteGeo(routeCache.current[m.id]);
      } else {
        const route = await getRoute(ciudadOruro, m.coords);
        if (route?.geometry) {
          routeCache.current[m.id] = route.geometry;
          setRouteGeo(route.geometry);
        } else {
          setRouteGeo(null);
        }
      }
    } else {
      setRouteGeo(null);
    }
  }, [routeVisible]);

  const routeInfo = useMemo(() => ({
    nombre: selected.nombre,
    provincia: selected.provincia,
  }), [selected]);

  const handleToggleRoute = useCallback(() => {
    setRouteVisible((v) => !v);
  }, []);

  return (
    <div className="map-page animate-fade-in">
      {/* Map layout — 3 columns */}
      <div className="map-layout">
        {/* Left: territory list */}
        <TerritoryPanel
          selected={selected}
          filtroEstado={filtroEstado}
          busqueda={busqueda}
          counts={counts}
          onSelect={handleSelect}
          onFilterChange={setFiltroEstado}
          onSearchChange={setBusqueda}
        />

        {/* Center: Leaflet map */}
        <MapaOruro
          selected={selected}
          filtroEstado={filtroEstado}
          busqueda={busqueda}
          counts={counts}
          routeVisible={routeVisible}
          routeGeo={routeGeo}
          routeInfo={routeInfo}
          onSelect={handleSelect}
          onToggleRoute={handleToggleRoute}
        />

        {/* Right: project list for selected municipio */}
        <ProjectList selected={selected} />
      </div>
    </div>
  );
}
