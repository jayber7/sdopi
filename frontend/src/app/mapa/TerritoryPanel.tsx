'use client';

import { type Municipio, municipios, estadoLabel, provincias } from '@/lib/municipios';

interface Props {
  selected: Municipio;
  filtroEstado: string;
  busqueda: string;
  onSelect: (m: Municipio) => void;
  onFilterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

function escapeHTML(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function limpiar(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function visibles(filtroEstado: string, busqueda: string) {
  return municipios.filter((m) => {
    const estadoOk = filtroEstado === 'todos' || m.estado === filtroEstado;
    const texto = limpiar([m.nombre, m.provincia, m.unidad, m.descripcion].join(' '));
    const busquedaOk = !busqueda || texto.includes(limpiar(busqueda));
    return estadoOk && busquedaOk;
  });
}

export default function TerritoryPanel({ selected, filtroEstado, busqueda, onSelect, onFilterChange, onSearchChange }: Props) {
  const lista = visibles(filtroEstado, busqueda);

  return (
    <div className="card flex flex-col" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-gold)' }}>Municipios</p>
          <p className="text-sm font-medium">{municipios.length} municipios</p>
        </div>
        <select value={filtroEstado} onChange={(e) => onFilterChange(e.target.value)}
          className="input input-sm" style={{ maxWidth: 100 }}>
          <option value="todos">Todos</option>
          {['normal', 'observado', 'alerta', 'concluido'].map((e) => (
            <option key={e} value={e}>{estadoLabel[e]}</option>
          ))}
        </select>
      </div>

      <div className="px-4 py-2">
        <input
          type="search"
          placeholder="Buscar municipio…"
          value={busqueda}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input input-sm"
        />
      </div>

      <div className="flex-1 overflow-auto px-2 pb-2 space-y-1">
        {lista.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className={`territory-item ${m.id === selected.id ? 'active' : ''}`}
          >
            <span className={`territory-dot ${m.estado}`} />
            <span className="flex-1 text-left min-w-0">
              <span className="text-sm font-medium block truncate">{m.nombre}</span>
              <span className="text-xs block" style={{ color: 'var(--color-ink-muted)' }}>{m.provincia}</span>
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>{m.avance}%</span>
          </button>
        ))}
        {lista.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--color-ink-faint)' }}>Sin resultados</p>
        )}
      </div>
    </div>
  );
}
