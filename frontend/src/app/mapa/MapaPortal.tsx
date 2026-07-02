'use client';

import { useState, useCallback, useRef, useMemo } from 'react';

import { municipios, type Municipio, ciudadOruro } from '@/lib/municipios';
import { getRoute } from '@/lib/osm-services';
import MapaOruro from './MapaOruro';
import TerritoryPanel from './TerritoryPanel';
import ProjectList from './ProjectList';

export default function MapaPortal() {
  const [selected, setSelected] = useState<Municipio>(municipios[0]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [routeVisible, setRouteVisible] = useState(true);
  const [routeGeo, setRouteGeo] = useState<any>(null);
  const routeCache = useRef<Record<string, any>>({});

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
          onSelect={handleSelect}
          onFilterChange={setFiltroEstado}
          onSearchChange={setBusqueda}
        />

        {/* Center: Leaflet map */}
        <MapaOruro
          selected={selected}
          filtroEstado={filtroEstado}
          busqueda={busqueda}
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
