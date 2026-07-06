'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LlenadoAsistido from './LlenadoAsistido';
import { mergeParsed } from '@/lib/proyecto-parser';
import { provincias, municipios } from '@/lib/municipios';
import { reverseNominatim } from '@/lib/osm-services';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

const API = '/api';

interface Item {
  id: number;
  numero: number;
  descripcion: string;
  unidad: string;
  montoOriginal: number;
}

interface Rubro {
  id: number;
  codigo: string;
  nombre: string;
  items: Item[];
}

interface Proyecto {
  id: number;
  nombre: string;
  contratoNro: string;
  montoContrato: number;
  contratista: string;
  supervisor: string;
  fiscal: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  ordenProceder: string;
  fechaConclusion: string;
  suspendidoDias: number;
  anticipoPct: number;
  jefatura: string;
  provincia: string | null;
  municipio: string | null;
  rubros: Rubro[];
}

const INIT_FORM = {
  nombre: '', contratoNro: '', montoContrato: 0, anticipoPct: 13.7747448,
  ordenProceder: '', fechaConclusion: '', suspendidoDias: 0,
  direccion: '', latitud: '', longitud: '',
  provincia: '', municipio: '',
  contratista: '', supervisor: '', fiscal: '',
  jefatura: 'DI',
};

export default function ProyectosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit?: Proyecto }>({ open: false });
  const [form, setForm] = useState({ ...INIT_FORM });
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const isAdmin = user?.role === 'admin';
  const isOper = user?.role === 'admin' || user?.role === 'operador';

  useEffect(() => { loadProyectos(); }, []);

  async function loadProyectos() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/proyectos`, { credentials: 'include' });
      setProyectos(r.ok ? await r.json() : []);
    } finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ ...INIT_FORM });
    setModal({ open: true });
  }

  function openEdit(p: Proyecto) {
    const tieneCoords = p.latitud !== null && p.longitud !== null;
    setForm({
      nombre: p.nombre, contratoNro: p.contratoNro, montoContrato: p.montoContrato,
      anticipoPct: p.anticipoPct, ordenProceder: p.ordenProceder?.slice(0, 10) || '',
      fechaConclusion: p.fechaConclusion?.slice(0, 10) || '',
      suspendidoDias: p.suspendidoDias,
      direccion: p.direccion,
      latitud: tieneCoords ? String(p.latitud) : '',
      longitud: tieneCoords ? String(p.longitud) : '',
      provincia: p.provincia || '', municipio: p.municipio || '',
      contratista: p.contratista, supervisor: p.supervisor, fiscal: p.fiscal, jefatura: p.jefatura,
    });
    setModal({ open: true, edit: p });
  }

  async function save() {
    const f = formRef.current;
    const required: (keyof typeof f)[] = ['nombre', 'contratoNro', 'montoContrato', 'ordenProceder', 'fechaConclusion', 'direccion', 'contratista', 'supervisor', 'fiscal'];
    for (const k of required) {
      if (!f[k] && f[k] !== 0) { alert(`Campo requerido: ${k}`); return; }
    }
    if (!f.latitud || !f.longitud) {
      alert('Debe seleccionar una ubicación en el mapa (coordenadas)');
      return;
    }
    const body: any = {
      ...f,
      montoContrato: Number(f.montoContrato),
      anticipoPct: Number(f.anticipoPct),
      suspendidoDias: Number(f.suspendidoDias),
      latitud: Number(f.latitud),
      longitud: Number(f.longitud),
    };
    const url = modal.edit ? `${API}/proyectos/${modal.edit.id}` : `${API}/proyectos`;
    const method = modal.edit ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), credentials: 'include',
    });
    if (!r.ok) { const t = await r.text().catch(() => ''); alert(`Error: ${t || r.statusText}`); return; }
    setModal({ open: false });
    await loadProyectos();
  }

  async function desactivar(p: Proyecto) {
    if (!confirm(`Desactivar proyecto "${p.nombre}"?`)) return;
    const r = await fetch(`${API}/proyectos/${p.id}`, { method: 'DELETE', credentials: 'include' });
    if (!r.ok) { alert('Error al desactivar'); return; }
    await loadProyectos();
  }

  if (loading) return <div style={{ color: 'var(--color-ink-muted)' }} className="animate-fade-in">Cargando...</div>;

  return (
    <div className="page-full animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl">Proyectos</h1>
        {isOper && <button onClick={openCreate} className="btn btn-primary">+ Nuevo Proyecto</button>}
      </div>

      <div className="space-y-4 stagger">
        {proyectos.map((p) => (
          <div key={p.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/proyectos/${p.id}`} style={{ color: 'var(--color-primary-light)' }} className="font-semibold hover:underline text-base">{p.nombre}</Link>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>Contrato: {p.contratoNro}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>Bs {p.montoContrato.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>{p.contratista}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                {isOper && <button onClick={() => openEdit(p)} className="btn btn-ghost btn-xs">Editar</button>}
                {isAdmin && <button onClick={() => desactivar(p)} className="btn btn-danger btn-xs">Desactivar</button>}
              </div>
              {p.rubros.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                    Rubros ({p.rubros.length})
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {p.rubros.map((r) => (
                      <div key={r.id} className="card">
                        <div className="card-body py-2 px-3">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{r.codigo} — {r.nombre}</p>
                          <p className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>{r.items.length} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {!loading && proyectos.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)' }} className="text-center py-12">No hay proyectos registrados.</p>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="dialog-backdrop">
          <div className="dialog animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{modal.edit ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
              <button onClick={() => setModal({ open: false })} className="btn btn-ghost btn-sm" style={{ fontSize: '1.125rem', lineHeight: 1, padding: '2px 8px' }}>&times;</button>
            </div>
            <div className="dialog-body space-y-3">
              <input placeholder="Nombre del proyecto" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input" />
              <input placeholder="N° Contrato" value={form.contratoNro} onChange={e => setForm({ ...form, contratoNro: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" placeholder="Monto Contrato Bs" value={form.montoContrato || ''} onChange={e => setForm({ ...form, montoContrato: +e.target.value })} className="input" />
                <input type="number" step="0.0001" placeholder="% Anticipo" value={form.anticipoPct} onChange={e => setForm({ ...form, anticipoPct: +e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Orden de Proceder
                  <input type="date" value={form.ordenProceder} onChange={e => setForm({ ...form, ordenProceder: e.target.value })} className="input input-sm mt-1" />
                </label>
                <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Fecha Conclusión
                  <input type="date" value={form.fechaConclusion} onChange={e => setForm({ ...form, fechaConclusion: e.target.value })} className="input input-sm mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Días Suspendidos" value={form.suspendidoDias} onChange={e => setForm({ ...form, suspendidoDias: +e.target.value })} className="input input-sm" />
                <select value={form.jefatura} onChange={e => setForm({ ...form, jefatura: e.target.value })} className="input input-sm">
                  <option value="DI">DI</option>
                  <option value="JE">JE</option>
                  <option value="JT">JT</option>
                  <option value="JUPRE">JUPRE</option>
                  <option value="JUS">JUS</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value, municipio: '', latitud: '', longitud: '', direccion: '' })} className="input">
                  <option value="">Seleccionar provincia</option>
                  {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={form.municipio} onChange={e => {
                  const m = municipios.find(m => m.nombre === e.target.value);
                  setForm(prev => ({
                    ...prev,
                    municipio: e.target.value,
                    latitud: m ? String(m.coords[0]) : prev.latitud,
                    longitud: m ? String(m.coords[1]) : prev.longitud,
                  }));
                  if (m) {
                    reverseNominatim(m.coords[0], m.coords[1]).then(dir => {
                      if (dir) setForm(prev => ({ ...prev, direccion: dir }));
                    });
                  }
                }} className="input">
                  <option value="">Seleccionar municipio</option>
                  {municipios.filter((m) => !form.provincia || m.provincia === form.provincia).map((m) => (
                    <option key={m.id} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <MapPicker
                lat={form.latitud ? parseFloat(form.latitud) : undefined}
                lng={form.longitud ? parseFloat(form.longitud) : undefined}
                onChange={(lat, lng) => setForm(prev => ({ ...prev, latitud: String(lat), longitud: String(lng) }))}
                onReverseGeocode={(dir) => setForm(prev => ({ ...prev, direccion: dir }))}
              />
              <input placeholder="Contratista" value={form.contratista} onChange={e => setForm({ ...form, contratista: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Supervisor" value={form.supervisor} onChange={e => setForm({ ...form, supervisor: e.target.value })} className="input" />
                <input placeholder="Fiscal" value={form.fiscal} onChange={e => setForm({ ...form, fiscal: e.target.value })} className="input" />
              </div>
              <LlenadoAsistido currentForm={form} onApply={(p) => setForm(mergeParsed(p, form) as any)} />
            </div>
            <div className="dialog-footer">
              <button onClick={() => setModal({ open: false })} className="btn btn-outline">Cancelar</button>
              <button onClick={save} className="btn btn-primary">{modal.edit ? 'Guardar Cambios' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
