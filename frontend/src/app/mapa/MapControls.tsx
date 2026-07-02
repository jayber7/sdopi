'use client';

const capasBase = [
  { key: 'osm', label: 'OSM' },
  { key: 'oscuro', label: 'Oscuro' },
  { key: 'satelite', label: 'Satélite' },
  { key: 'topo', label: 'Topo' },
];

interface Props {
  baseLayer: string;
  polygonsVisible: boolean;
  routeVisible: boolean;
  onBaseLayerChange: (k: string) => void;
  onPolygonsToggle: () => void;
  onToggleRoute: () => void;
  onCenterOruro: () => void;
  onFullscreen: () => void;
}

export default function MapControls({
  baseLayer, polygonsVisible, routeVisible,
  onBaseLayerChange, onPolygonsToggle, onToggleRoute,
  onCenterOruro, onFullscreen,
}: Props) {
  return (
    <div className="map-controls">
      <div className="map-controls-section">
        {[
          { label: 'Centrar Oruro', id: 'centerBtn', action: onCenterOruro },
          { label: routeVisible ? 'Ocultar línea' : 'Mostrar línea', id: 'toggleRouteBtn', action: onToggleRoute },
          { label: 'Pantalla completa', id: 'fullscreenBtn', action: onFullscreen },
        ].map((btn) => (
          <button key={btn.id} id={btn.id} type="button" className="control-btn wide" onClick={btn.action}>
            {btn.label}
          </button>
        ))}
      </div>

      <div className="map-controls-section">
        <span className="control-label">Capa:</span>
        <div className="control-radio-group">
          {capasBase.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`control-radio${baseLayer === c.key ? ' active' : ''}`}
              onClick={() => onBaseLayerChange(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-controls-section">
        <span className="control-label">Capas:</span>
        <label className="control-checkbox">
          <input type="checkbox" checked={polygonsVisible} onChange={onPolygonsToggle} />
          Polígonos
        </label>
      </div>
    </div>
  );
}
