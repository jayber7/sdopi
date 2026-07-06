'use client';

import { useState, useEffect, Fragment, forwardRef, useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import LlenadoAsistido from '../LlenadoAsistido';
import { mergeParsed } from '@/lib/proyecto-parser';
import { provincias, municipios } from '@/lib/municipios';
import { reverseNominatim } from '@/lib/osm-services';
import { EvidenciaStatsButton, PanelEvidencias, PanelGeneralEvidencias } from './PanelEvidencias';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../MapPicker'), { ssr: false });

const API = '/api';
const fmt = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2 });
const fdate = (d: string) => new Date(d).toLocaleDateString('es-BO');

interface BaseItem { id: number; numero: number; descripcion: string; unidad: string; precioUnitario: number; cantidadContrato: number; montoOriginal: number; rubroId: number }
interface Rubro { id: number; codigo: string; nombre: string; items: BaseItem[] }
interface EvidenciaInfo {
  count: number;
  mejorEstado: string | null;
  estados: string[];
}

interface Avance {
  id: number; cantidad: number; monto: number; avancePct: number;
  itemId: number | null; planillaId: number;
  descripcion: string | null; unidad: string | null;
  precioUnitario: number | null; cantidadContrato: number | null;
  rubroCodigo: string | null; rubroNombre: string | null;
  aprobado: boolean | null;
  item: (BaseItem & { rubro?: Rubro }) | null;
  evidencia?: EvidenciaInfo;
}
interface Planilla {
  id: number; tipo: 'BASE' | 'CAO'; numero: number; periodo: string;
  fechaInicio: string; fechaFin: string; estado: string;
  proyectoId: number; planillaBaseId: number | null;
  planillaBase: Planilla | null;
  historico: Record<number, { cantidad: number; monto: number }> | null;
  avances: Avance[];
}
interface Proyecto { id: number; nombre: string; contratoNro: string; montoContrato: number; contratista: string; supervisor: string; fiscal: string; rubros: Rubro[]; planillas: Planilla[]; [k: string]: any }

const INIT_FORM = {
  nombre: '', contratoNro: '', montoContrato: 0, anticipoPct: 13.7747448,
  ordenProceder: '', fechaConclusion: '', suspendidoDias: 0,
  direccion: '', latitud: '', longitud: '',
  provincia: '', municipio: '',
  contratista: '', supervisor: '', fiscal: '',
  jefatura: 'DI',
};

export default function ProyectoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const [tab, setTab] = useState<'general' | 'planillas'>('planillas');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ numero: 0, periodo: '', fechaInicio: '', fechaFin: '', tipo: 'CAO' as 'BASE' | 'CAO' });
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...INIT_FORM });
  const editFormRef = useRef(editForm);
  useEffect(() => { editFormRef.current = editForm; }, [editForm]);

  const [editHeader, setEditHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ periodo: '', fechaInicio: '', fechaFin: '' });
  const puccRef = useRef<{ saveAllPending: () => Promise<void> }>(null);
  const [evidenciaItemId, setEvidenciaItemId] = useState<number | null>(null);
  const [showGeneralEvidencia, setShowGeneralEvidencia] = useState(false);

  const isOper = user?.role === 'operador';
  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const isBorrador = planilla?.estado === 'borrador';
  const isEnviado = planilla?.estado === 'enviado';
  const isBase = planilla?.tipo === 'BASE';
  const hasRejected = planilla?.avances?.some((a) => a.aprobado === false) ?? false;

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    setLoading(true);
    fetch(`${API}/proyectos/${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (p) => {
        setProyecto(p);
        if (p?.planillas?.length) loadPlanilla(p.planillas[0].id);
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function loadPlanilla(id: number) {
    const r = await fetch(`${API}/planillas/${id}`, { credentials: 'include' });
    if (r.ok) setPlanilla(await r.json());
  }

  async function handleAprobarPlanilla() {
    if (!planilla) return;
    const r = await fetch(`${API}/planillas/${planilla.id}/aprobar`, { method: 'PATCH', credentials: 'include' });
    if (r.ok && proyecto) {
      setPlanilla(await r.json());
      const rp = await fetch(`${API}/proyectos/${proyecto.id}`, { credentials: 'include' });
      if (rp.ok) setProyecto(await rp.json());
    } else {
      const err = await r.json().catch(() => ({ message: 'Error al aprobar' }));
      if (r.status === 400 && err.message?.toLowerCase().includes('evidencia')) {
        if (confirm(`${err.message}\n\n¿Forzar aprobación?`)) {
          const rf = await fetch(`${API}/planillas/${planilla.id}/aprobar?force=true`, { method: 'PATCH', credentials: 'include' });
          if (rf.ok && proyecto) {
            setPlanilla(await rf.json());
            const rp = await fetch(`${API}/proyectos/${proyecto.id}`, { credentials: 'include' });
            if (rp.ok) setProyecto(await rp.json());
          } else alert('Error al forzar aprobación');
        }
      } else {
        alert(err.message || 'Error');
      }
    }
  }

  async function doEndpoint(path: string) {
    if (!planilla) return;
    const r = await fetch(`${API}${path}`, { method: 'PATCH', credentials: 'include' });
    if (r.ok) setPlanilla(await r.json());
    else alert('Error');
  }

  function startEditHeader() {
    if (!planilla) return;
    setHeaderForm({ periodo: planilla.periodo, fechaInicio: planilla.fechaInicio?.slice(0, 10) || '', fechaFin: planilla.fechaFin?.slice(0, 10) || '' });
    setEditHeader(true);
  }

  async function saveHeader() {
    if (!planilla) return;
    const r = await fetch(`${API}/planillas/${planilla.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(headerForm), credentials: 'include',
    });
    if (r.ok) { setPlanilla(await r.json()); setEditHeader(false); }
  }

  function openEdit() {
    if (!proyecto) return;
    const tieneCoords = proyecto.latitud !== null && proyecto.longitud !== null;
    setEditForm({
      nombre: proyecto.nombre, contratoNro: proyecto.contratoNro,
      montoContrato: proyecto.montoContrato, anticipoPct: proyecto.anticipoPct,
      ordenProceder: proyecto.ordenProceder?.slice(0, 10) || '',
      fechaConclusion: proyecto.fechaConclusion?.slice(0, 10) || '',
      suspendidoDias: proyecto.suspendidoDias,
      direccion: proyecto.direccion,
      latitud: tieneCoords ? String(proyecto.latitud) : '',
      longitud: tieneCoords ? String(proyecto.longitud) : '',
      provincia: proyecto.provincia || '', municipio: proyecto.municipio || '',
      contratista: proyecto.contratista,
      supervisor: proyecto.supervisor, fiscal: proyecto.fiscal,
      jefatura: proyecto.jefatura,
    });
    setEditModal(true);
  }

  async function saveEdit() {
    if (!proyecto) return;
    const f = editFormRef.current;
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
    const r = await fetch(`${API}/proyectos/${proyecto.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), credentials: 'include',
    });
    if (!r.ok) { const t = await r.text().catch(() => ''); alert(`Error: ${t || r.statusText}`); return; }
    setProyecto(await r.json());
    setEditModal(false);
  }

  async function desactivar() {
    if (!proyecto || !confirm(`Desactivar proyecto "${proyecto.nombre}"? Esta accion no se puede revertir.`)) return;
    const r = await fetch(`${API}/proyectos/${proyecto.id}`, { method: 'DELETE', credentials: 'include' });
    if (!r.ok) { alert('Error al desactivar'); return; }
    router.push('/proyectos');
  }

  async function createPlanilla() {
    if (!proyecto) return;
    const r = await fetch(`${API}/planillas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proyectoId: proyecto.id, numero: form.numero, periodo: form.periodo,
        fechaInicio: form.fechaInicio, fechaFin: form.fechaFin,
        tipo: form.tipo, planillaBaseId: form.tipo === 'CAO' ? proyecto.planillas.find(p => p.tipo === 'BASE')?.id : undefined,
      }),
      credentials: 'include',
    });
    if (r.ok) {
      const p = await r.json();
      setShowForm(false);
      setForm({ numero: 0, periodo: '', fechaInicio: '', fechaFin: '', tipo: 'CAO' });
      setProyecto((prev) => prev ? { ...prev, planillas: [...prev.planillas, p] } : prev);
      loadPlanilla(p.id);
    } else {
      const err = await r.json().catch(() => ({ message: 'Error al crear planilla' }));
      alert(err.message || 'Error al crear planilla');
    }
  }

  async function deletePlanilla() {
    if (!planilla || !confirm('Eliminar esta planilla?')) return;
    const r = await fetch(`${API}/planillas/${planilla.id}`, { method: 'DELETE', credentials: 'include' });
    if (!r.ok) { const err = await r.json().catch(() => ({ message: 'Error al eliminar' })); alert(err.message); return; }
    setProyecto((prev) => prev ? { ...prev, planillas: prev.planillas.filter((p) => p.id !== planilla.id) } : prev);
    setPlanilla(null);
  }

  function historico(av: Avance) {
    if (!av.itemId || !planilla?.historico) return { cantidad: 0, monto: 0 };
    return planilla.historico[av.itemId] || { cantidad: 0, monto: 0 };
  }

  if (loading) return <div style={{ color: 'var(--color-ink-muted)' }} className="animate-fade-in">Cargando...</div>;
  if (!proyecto) return <div className="text-red-500">Proyecto no encontrado</div>;

  return (
    <div className="page-full animate-fade-in">
      <div className="space-y-6">
      {/* Project header */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl">{proyecto.nombre}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                Contrato: {proyecto.contratoNro} · {proyecto.contratista}
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>Bs {fmt(proyecto.montoContrato)}</p>
              <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Sup: {proyecto.supervisor} · Fiscal: {proyecto.fiscal}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {(isAdmin || isOper) && <button onClick={openEdit} className="btn btn-outline btn-xs">Editar proyecto</button>}
            {isAdmin && <button onClick={desactivar} className="btn btn-danger btn-xs">Desactivar proyecto</button>}
            <button onClick={() => window.open(`/reportes/${proyecto.id}`, '_blank')} className="btn btn-outline btn-xs">📊 Reportes</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setTab('general')} className={`tab ${tab === 'general' ? 'active' : ''}`}>General</button>
        <button onClick={() => setTab('planillas')} className={`tab ${tab === 'planillas' ? 'active' : ''}`}>Planillas ({proyecto.planillas.length})</button>
      </div>

      {tab === 'general' && (
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><span style={{ color: 'var(--color-ink-muted)' }}>Ubicación:</span> {proyecto.latitud != null && proyecto.longitud != null ? `${proyecto.latitud}, ${proyecto.longitud}` : (proyecto.direccion || '—')}</p>
              <p><span style={{ color: 'var(--color-ink-muted)' }}>Orden de Proceder:</span> {fdate(proyecto.ordenProceder)}</p>
              <p><span style={{ color: 'var(--color-ink-muted)' }}>Fecha Conclusión:</span> {fdate(proyecto.fechaConclusion)}</p>
              <p><span style={{ color: 'var(--color-ink-muted)' }}>Días Suspendido:</span> {proyecto.suspendidoDias}</p>
              <p><span style={{ color: 'var(--color-ink-muted)' }}>% Anticipo:</span> {proyecto.anticipoPct}%</p>
              <p><span style={{ color: 'var(--color-ink-muted)' }}>Jefatura:</span> {proyecto.jefatura}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'planillas' && (
        <div className="space-y-5">
          {/* Planilla selector */}
          <div className="card">
            <div className="card-body">
              <div className="pill-group">
                <span className="text-xs font-medium mr-1" style={{ color: 'var(--color-ink-muted)', alignSelf: 'center' }}>Planillas:</span>
                {proyecto.planillas.map((p) => (
                  <button key={p.id} onClick={() => loadPlanilla(p.id)}
                    className={`pill ${planilla?.id === p.id ? (p.tipo === 'BASE' ? 'pill-base active' : 'active') : (p.tipo === 'BASE' ? 'pill-base' : '')}`}
                    title={p.periodo}>
                    {p.tipo === 'BASE' ? 'BASE' : `N°${p.numero}`}
                  </button>
                ))}

              </div>
            </div>
          </div>

          {/* Create planilla form */}
          {showForm && (
            <div className="card animate-slide-down">
              <div className="card-header">
                <h3 style={{ fontSize: '0.9375rem' }}>Nueva Planilla</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="tipo" value="CAO" checked={form.tipo === 'CAO'} onChange={() => setForm({ ...form, tipo: 'CAO' })} />
                    CAO
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="tipo" value="BASE" checked={form.tipo === 'BASE'} onChange={() => setForm({ ...form, tipo: 'BASE' })} />
                    BASE
                  </label>
                  {form.tipo === 'BASE' && proyecto.planillas.some(p => p.tipo === 'BASE') && (
                    <span className="badge badge-error">Ya existe una Planilla Base</span>
                  )}
                  {form.tipo === 'CAO' && !proyecto.planillas.some(p => p.tipo === 'BASE') && (
                    <span className="badge badge-warning">Primero debe crear una Planilla Base</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Número" value={form.numero || ''} onChange={(e) => setForm({ ...form, numero: +e.target.value })} className="input" />
                  <input placeholder="Período" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} className="input" />
                  <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Inicio
                    <input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className="input input-sm mt-1" />
                  </label>
                  <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Fin
                    <input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} className="input input-sm mt-1" />
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={createPlanilla} disabled={form.tipo === 'CAO' && !proyecto.planillas.some(p => p.tipo === 'BASE')} className="btn btn-primary btn-sm">Crear</button>
                  <button onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Planilla detail */}
          {planilla && (
            <div className="card stagger">
              {/* Planilla header */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  {isBase ? (
                    <>
                      <span className="badge badge-info">BASE</span>
                      <span className="font-semibold text-sm">Planilla Base — Datos Según Contrato</span>
                    </>
                  ) : (
                    <span className="font-semibold text-sm">CAO N&deg;{planilla.numero}</span>
                  )}
                  <span className={`badge ${planilla.estado === 'borrador' ? 'badge-warning' : planilla.estado === 'enviado' ? 'badge-info' : planilla.estado === 'aprobado' ? 'badge-success' : 'badge-muted'}`}>
                    {planilla.estado}
                  </span>
                  {!isBase && !editHeader && (
                    <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                      {planilla.periodo} ({fdate(planilla.fechaInicio)} — {fdate(planilla.fechaFin)})
                    </span>
                  )}
                  {!isBase && editHeader && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input value={headerForm.periodo} onChange={(e) => setHeaderForm({ ...headerForm, periodo: e.target.value })} className="input input-sm w-40" placeholder="Período" />
                      <label className="text-xs">Inicio
                        <input type="date" value={headerForm.fechaInicio} onChange={(e) => setHeaderForm({ ...headerForm, fechaInicio: e.target.value })} className="input input-sm ml-1" />
                      </label>
                      <label className="text-xs">Fin
                        <input type="date" value={headerForm.fechaFin} onChange={(e) => setHeaderForm({ ...headerForm, fechaFin: e.target.value })} className="input input-sm ml-1" />
                      </label>
                      <button onClick={saveHeader} className="btn btn-primary btn-xs">💾</button>
                      <button onClick={() => setEditHeader(false)} className="btn btn-ghost btn-xs">Cancelar</button>
                    </div>
                  )}
                  {isBorrador && (isOper || isAdmin) && !editHeader && (
                    <button onClick={startEditHeader} className="btn btn-ghost btn-xs" title="Editar período y fechas">📅</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {planilla && planilla.tipo === 'CAO' && <EvidenciaStatsButton planillaId={planilla.id} onClick={() => setShowGeneralEvidencia(true)} />}
                  {isBorrador && (isOper || isAdmin) && <button onClick={async () => { await puccRef.current?.saveAllPending(); await doEndpoint(`/planillas/${planilla.id}/enviar`); }} className="btn btn-primary btn-sm">Enviar para Aprobación</button>}
                  {isEnviado && isAdmin && <button onClick={handleAprobarPlanilla} className="btn btn-success btn-sm">Aprobar Todo</button>}
                  {isEnviado && isAdmin && hasRejected && <button onClick={() => doEndpoint(`/planillas/${planilla.id}/revisar`)} className="btn btn-warning btn-sm">Devolver a Borrador</button>}
                  {isAdmin && !isBase && <button onClick={deletePlanilla} className="btn btn-danger btn-sm">Eliminar</button>}
                </div>
              </div>

              {/* Grid / content */}
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                {isBase ? (
                  <BaseGrid
                    ref={puccRef}
                    planilla={planilla} isAdmin={isAdmin} isOper={isOper}
                    onRefresh={() => loadPlanilla(planilla.id)}
                    proyectoId={proyecto.id} rubros={proyecto.rubros}
                    onProjectRefresh={async () => {
                      const r = await fetch(`${API}/proyectos/${proyecto.id}`, { credentials: 'include' });
                      if (r.ok) setProyecto(await r.json());
                    }}
                  />
                ) : <CAOGrid planilla={planilla} isAdmin={isAdmin} isOper={isOper} isSupervisor={isSupervisor} onRefresh={() => loadPlanilla(planilla.id)} onOpenEvidencia={(id) => setEvidenciaItemId(id)} />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evidence modals */}
      {evidenciaItemId != null && planilla && (
        <PanelEvidencias
          planilla={planilla}
          avanceItemId={evidenciaItemId}
          onClose={() => setEvidenciaItemId(null)}
          onRefresh={() => loadPlanilla(planilla.id)}
        />
      )}
      {showGeneralEvidencia && planilla && (
        <PanelGeneralEvidencias
          planilla={planilla}
          onClose={() => setShowGeneralEvidencia(false)}
          onOpenItem={(id) => { setShowGeneralEvidencia(false); setTimeout(() => setEvidenciaItemId(id), 50); }}
        />
      )}

      {/* Edit Modal */}
      {editModal && createPortal((
        <div className="dialog-backdrop">
          <div className="dialog animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Editar Proyecto</h3>
              <button onClick={() => setEditModal(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '1.125rem', lineHeight: 1, padding: '2px 8px' }}>&times;</button>
            </div>
            <div className="dialog-body space-y-3">
              <input placeholder="Nombre del proyecto" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} className="input" />
              <input placeholder="N° Contrato" value={editForm.contratoNro} onChange={e => setEditForm({ ...editForm, contratoNro: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" placeholder="Monto Contrato Bs" value={editForm.montoContrato || ''} onChange={e => setEditForm({ ...editForm, montoContrato: +e.target.value })} className="input" />
                <input type="number" step="0.0001" placeholder="% Anticipo" value={editForm.anticipoPct} onChange={e => setEditForm({ ...editForm, anticipoPct: +e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Orden de Proceder
                  <input type="date" value={editForm.ordenProceder} onChange={e => setEditForm({ ...editForm, ordenProceder: e.target.value })} className="input input-sm mt-1" />
                </label>
                <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Fecha Conclusión
                  <input type="date" value={editForm.fechaConclusion} onChange={e => setEditForm({ ...editForm, fechaConclusion: e.target.value })} className="input input-sm mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Días Suspendidos" value={editForm.suspendidoDias} onChange={e => setEditForm({ ...editForm, suspendidoDias: +e.target.value })} className="input input-sm" />
                <select value={editForm.jefatura} onChange={e => setEditForm({ ...editForm, jefatura: e.target.value })} className="input input-sm">
                  <option value="DI">DI</option>
                  <option value="JE">JE</option>
                  <option value="JT">JT</option>
                  <option value="JUPRE">JUPRE</option>
                  <option value="JUS">JUS</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={editForm.provincia} onChange={e => setEditForm({ ...editForm, provincia: e.target.value, municipio: '', latitud: '', longitud: '', direccion: '' })} className="input">
                  <option value="">Seleccionar provincia</option>
                  {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={editForm.municipio} onChange={e => {
                  const m = municipios.find(m => m.nombre === e.target.value);
                  setEditForm(prev => ({
                    ...prev,
                    municipio: e.target.value,
                    latitud: m ? String(m.coords[0]) : prev.latitud,
                    longitud: m ? String(m.coords[1]) : prev.longitud,
                  }));
                  if (m) {
                    reverseNominatim(m.coords[0], m.coords[1]).then(dir => {
                      if (dir) setEditForm(prev => ({ ...prev, direccion: dir }));
                    });
                  }
                }} className="input">
                  <option value="">Seleccionar municipio</option>
                  {municipios.filter((m) => !editForm.provincia || m.provincia === editForm.provincia).map((m) => (
                    <option key={m.id} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <MapPicker
                lat={editForm.latitud ? parseFloat(editForm.latitud) : undefined}
                lng={editForm.longitud ? parseFloat(editForm.longitud) : undefined}
                onChange={(lat, lng) => setEditForm(prev => ({ ...prev, latitud: String(lat), longitud: String(lng) }))}
                onReverseGeocode={(dir) => setEditForm(prev => ({ ...prev, direccion: dir }))}
              />
              <input placeholder="Contratista" value={editForm.contratista} onChange={e => setEditForm({ ...editForm, contratista: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Supervisor" value={editForm.supervisor} onChange={e => setEditForm({ ...editForm, supervisor: e.target.value })} className="input" />
                <input placeholder="Fiscal" value={editForm.fiscal} onChange={e => setEditForm({ ...editForm, fiscal: e.target.value })} className="input" />
              </div>
              <LlenadoAsistido currentForm={editForm} onApply={(p) => setEditForm(mergeParsed(p, editForm) as any)} />
            </div>
            <div className="dialog-footer">
              <button onClick={() => setEditModal(false)} className="btn btn-outline">Cancelar</button>
              <button onClick={saveEdit} className="btn btn-primary">Guardar Cambios</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  </div>
  );
}

const BaseGrid = forwardRef(function BaseGrid({ planilla, isAdmin, isOper, onRefresh, proyectoId, rubros, onProjectRefresh }: {
  planilla: Planilla; isAdmin: boolean; isOper: boolean; onRefresh: () => void;
  proyectoId: number; rubros: Rubro[]; onProjectRefresh: () => Promise<void>;
}, ref: React.Ref<{ saveAllPending: () => Promise<void> }>) {
  const [editPU, setEditPU] = useState<Record<number, number>>({});
  const [editCC, setEditCC] = useState<Record<number, number>>({});
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [editRubro, setEditRubro] = useState<{ id?: number; codigo: string; nombre: string } | null>(null);
  const [editItem, setEditItem] = useState<{ id?: number; rubroId: number; numero: number; descripcion: string; unidad: string } | null>(null);

  const jefatura = 'DI';
  const [showCat, setShowCat] = useState(false);
  const [catRubros, setCatRubros] = useState<any[]>([]);
  const [catItems, setCatItems] = useState<Record<number, any[]>>({});
  const [catSearch, setCatSearch] = useState('');
  const [catSel, setCatSel] = useState<Record<number, Set<number>>>({});
  const [catExpanded, setCatExpanded] = useState<Record<number, boolean>>({});

  const isBorrador = planilla.estado === 'borrador';
  const isEnviado = planilla.estado === 'enviado';
  const canEdit = isBorrador && (isAdmin || isOper);
  const actionCol = (isAdmin && isEnviado) || canEdit ? 1 : 0;

  function loadCatalogo() {
    fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' })
      .then(r => r.ok && r.json()).then(setCatRubros);
  }
  async function loadCatItems(id: number) {
    if (catItems[id]) return;
    const r = await fetch(`${API}/catalogo/rubros/${id}/items`, { credentials: 'include' });
    if (r.ok) { const data = await r.json(); setCatItems(p => ({ ...p, [id]: data })); }
  }
  function toggleSel(rubroId: number, itemId: number) {
    setCatSel(p => { const s = new Set(p[rubroId] || []); s.has(itemId) ? s.delete(itemId) : s.add(itemId); return { ...p, [rubroId]: s }; });
  }
  function toggleAll(rubroId: number, items: any[]) {
    setCatSel(p => { const s = new Set(p[rubroId] || []); items.forEach(i => s.has(i.id) ? s.delete(i.id) : s.add(i.id)); return { ...p, [rubroId]: s }; });
  }
  async function importar() {
    const rubros = Object.entries(catSel).filter(([_, s]) => s.size > 0).map(([id, s]) => ({ rubroCatalogoId: +id, itemCatalogoIds: [...s] }));
    if (!rubros.length) return;
    await apiFetch('POST', `${API}/proyectos/${proyectoId}/importar-items`, { rubros });
    setShowCat(false); setCatSel({}); await onProjectRefresh(); await onRefresh();
  }

  async function apiFetch(method: string, url: string, body?: any) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), credentials: 'include' });
    if (!r.ok) { const t = await r.text().catch(() => ''); alert(`Error ${r.status}: ${t || r.statusText}`); throw new Error(`${r.status} ${t}`); }
    return r.json().catch(() => null);
  }

  async function saveRubro() {
    if (!editRubro) return;
    try {
      if (editRubro.id) {
        await apiFetch('PATCH', `${API}/rubros/${editRubro.id}`, { codigo: editRubro.codigo, nombre: editRubro.nombre });
      } else {
        await apiFetch('POST', `${API}/rubros`, { codigo: editRubro.codigo, nombre: editRubro.nombre, proyectoId });
      }
      setEditRubro(null);
      await onProjectRefresh();
    } catch {}
  }

  async function deleteRubro(id: number) {
    if (!confirm('Eliminar rubro y todos sus items?')) return;
    try {
      await apiFetch('DELETE', `${API}/rubros/${id}`);
      await onProjectRefresh(); await onRefresh();
    } catch {}
  }

  async function saveItem() {
    if (!editItem) return;
    const body = { rubroId: editItem.rubroId, numero: editItem.numero, descripcion: editItem.descripcion, unidad: editItem.unidad };
    try {
      if (editItem.id) {
        await apiFetch('PATCH', `${API}/items/${editItem.id}`, body);
      } else {
        await apiFetch('POST', `${API}/items`, { ...body, precioUnitario: 0, cantidadContrato: 0 });
        await fetch(`${API}/planillas/${planilla.id}/sync-from-items`, { method: 'PATCH', credentials: 'include' });
      }
      setEditItem(null);
      await onProjectRefresh(); await onRefresh();
    } catch {}
  }

  async function deleteItem(itemId: number) {
    if (!confirm('Eliminar item?')) return;
    try {
      await apiFetch('DELETE', `${API}/items/${itemId}`);
      await onProjectRefresh(); await onRefresh();
    } catch {}
  }

  function getPU(av: Avance) {
    if (editPU[av.id] !== undefined) return editPU[av.id];
    return av.precioUnitario ?? av.item?.precioUnitario ?? 0;
  }
  function getCC(av: Avance) {
    if (editCC[av.id] !== undefined) return editCC[av.id];
    return av.cantidadContrato ?? av.item?.cantidadContrato ?? 1;
  }

  async function saveBaseItem(av: Avance) {
    const pu = editPU[av.id];
    const cc = editCC[av.id];
    if (pu === undefined && cc === undefined) return;
    await fetch(`${API}/planillas/${planilla.id}/items`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{
        avanceId: av.id, itemId: av.itemId,
        ...(pu !== undefined ? { precioUnitario: pu } : {}),
        ...(cc !== undefined ? { cantidadContrato: cc } : {}),
        cantidad: 0,
      }] }),
      credentials: 'include',
    });
    const n1 = { ...editPU }; delete n1[av.id]; setEditPU(n1);
    const n2 = { ...editCC }; delete n2[av.id]; setEditCC(n2);
    setSaved(prev => new Set([...prev, av.id]));
    onRefresh();
  }

  async function saveAllPending() {
    if (!planilla) return;
    const ids = new Set([...Object.keys(editPU), ...Object.keys(editCC)]);
    if (!ids.size) return;
    const items = [...ids].map(id => {
      const av = planilla.avances.find(a => a.id === +id);
      if (!av) return null;
      const pu = editPU[av.id];
      const cc = editCC[av.id];
      if (pu === undefined && cc === undefined) return null;
      return { avanceId: av.id, itemId: av.itemId, ...(pu !== undefined ? { precioUnitario: pu } : {}), ...(cc !== undefined ? { cantidadContrato: cc } : {}), cantidad: 0 };
    }).filter(Boolean);
    await fetch(`${API}/planillas/${planilla.id}/items`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }), credentials: 'include',
    });
    setEditPU({});
    setEditCC({});
    setSaved(new Set());
    onRefresh();
  }
  useImperativeHandle(ref, () => ({ saveAllPending }), [editPU, editCC, planilla]);

  function unlockPUCC(av: Avance) {
    const n = new Set(saved); n.delete(av.id); setSaved(n);
    setEditPU(m => ({ ...m, [av.id]: av.precioUnitario ?? av.item?.precioUnitario ?? 0 }));
    setEditCC(m => ({ ...m, [av.id]: av.cantidadContrato ?? av.item?.cantidadContrato ?? 1 }));
  }

  async function handleApprove(av: Avance) {
    await fetch(`${API}/planillas/${planilla.id}/aprobar-item/${av.id}`, { method: 'PATCH', credentials: 'include' });
    onRefresh();
  }

  async function handleReject(av: Avance) {
    await fetch(`${API}/planillas/${planilla.id}/rechazar-item/${av.id}`, { method: 'PATCH', credentials: 'include' });
    onRefresh();
  }

  function findRubro(id: number | null, codigo: string) {
    if (id) return rubros.find(r => r.id === id);
    return rubros.find(r => r.codigo === codigo);
  }
  function avanceCountInRubro(avs: Avance[], codigo: string) {
    return avs.filter(a => (a.rubroCodigo ?? a.item?.rubro?.codigo ?? 'SIN') === codigo).length;
  }

  const totalMO = planilla.avances.reduce((s, a) => s + getPU(a) * getCC(a), 0);
  const canManage = canEdit && (isAdmin || isOper);
  return (
    <>
      {(isBorrador || isEnviado) && (
        <div style={{ borderBottom: '1px solid var(--color-border-light)', padding: '16px 20px' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 style={{ fontSize: '0.9375rem' }}>Rubros e Items</h2>
            {canManage && <div className="flex gap-2">
              <button onClick={() => setEditRubro({ codigo: '', nombre: '' })} className="btn btn-success btn-sm">+ Rubro</button>
              <button onClick={() => { loadCatalogo(); setShowCat(true); }} className="btn btn-outline btn-sm">Importar del catálogo</button>
            </div>}
          </div>
          {editRubro && !editRubro.id && (
            <div className="card flex items-center gap-2 px-3 py-2" style={{ flexDirection: 'row', borderStyle: 'dashed' }}>
              <input placeholder="Código" value={editRubro.codigo} onChange={(e) => setEditRubro({ ...editRubro, codigo: e.target.value })} className="input input-sm w-20" />
              <input placeholder="Nombre" value={editRubro.nombre} onChange={(e) => setEditRubro({ ...editRubro, nombre: e.target.value })} className="input input-sm flex-1" />
              <button onClick={saveRubro} className="btn btn-primary btn-xs">Guardar</button>
              <button onClick={() => setEditRubro(null)} className="btn btn-ghost btn-xs">Cancelar</button>
            </div>
          )}
        </div>
      )}

      {planilla.estado === 'aprobado' && (
        <div className="banner banner-info" style={{ margin: '10px 16px' }}>Planilla Base aprobada — datos inmutables.</div>
      )}

      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th style={{ minWidth: 200 }}>Descripción</th>
            <th style={{ width: 36 }}>Und</th>
            <th className="text-right">Precio Unit.</th>
            <th className="text-right">Cant. Contrato</th>
            <th className="text-right">Monto Original</th>
            <th className="text-center" style={{ width: 40 }}>Est.</th>
            {actionCol > 0 && <th className="text-center">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {groupAvances(planilla.avances).map((g) => {
            const rubro = findRubro(g.rubroId, g.codigo);
            const inEditRubro = editRubro !== null && editRubro?.id === rubro?.id;
            const showNewItem = editItem !== null && editItem?.rubroId === rubro?.id && !editItem?.id;
            return (
              <Fragment key={g.rubroId ?? g.codigo}>
                {inEditRubro ? (
                  <tr style={{ background: 'var(--color-primary-faint)' }}>
                    <td colSpan={7 + actionCol} className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <input value={editRubro!.codigo} onChange={(e) => setEditRubro({ ...editRubro!, codigo: e.target.value })} className="input input-sm w-20" />
                        <input value={editRubro!.nombre} onChange={(e) => setEditRubro({ ...editRubro!, nombre: e.target.value })} className="input input-sm flex-1" />
                        <button onClick={saveRubro} className="btn btn-primary btn-xs">Guardar</button>
                        <button onClick={() => setEditRubro(null)} className="btn btn-ghost btn-xs">Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr style={{ background: 'var(--color-primary-faint)' }}>
                    <td colSpan={7 + actionCol} className="px-3 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{g.codigo} - {g.nombre}</span>
                        {canManage && rubro && (
                          <div className="flex gap-1">
                            <button onClick={() => setEditRubro({ id: rubro.id, codigo: rubro.codigo, nombre: rubro.nombre })} className="btn btn-ghost btn-xs">Editar</button>
                            <button onClick={() => deleteRubro(rubro.id)} className="btn btn-danger btn-xs">Eliminar</button>
                            <button onClick={() => setEditItem({ rubroId: rubro.id, numero: avanceCountInRubro(planilla.avances, g.codigo) + 1, descripcion: '', unidad: '' })} className="btn btn-outline btn-xs">+ Item</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {g.avances.map((av) => {
                  const pu = getPU(av);
                  const cc = getCC(av);
                  const mo = pu * cc;
                  const isPending = av.aprobado === null && planilla.estado !== 'borrador';
                  const isRechazado = av.aprobado === false;
                  const isLocked = saved.has(av.id);
                  return (
                  <tr key={av.id} data-rubro-codigo={g.codigo} data-item-numero={av.item?.numero ?? 'N'} className={isPending ? 'bg-yellow-50' : isRechazado ? 'bg-red-50' : ''}>
                      <td>{av.item?.numero ?? 'N'}</td>
                      <td>{av.descripcion ?? av.item?.descripcion ?? ''}</td>
                      <td style={{ padding: '8px 4px' }}>{av.unidad ?? av.item?.unidad ?? ''}</td>
                      <td className="text-right">
                        {canEdit && av.aprobado !== true && !isLocked
                      ? <input type="number" step="0.01" value={pu} onChange={(e) => setEditPU((m) => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm w-20 text-right" data-item-numero={av.item?.numero ?? 'N'} data-field="pu" />
                      : fmt(pu)}
                    </td>
                    <td className="text-right">
                      {canEdit && av.aprobado !== true && !isLocked
                        ? <input type="number" step="0.01" value={cc} onChange={(e) => setEditCC((m) => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm w-20 text-right" data-item-numero={av.item?.numero ?? 'N'} data-field="cc" />
                          : fmt(cc)}
                      </td>
                      <td className="text-right">{fmt(mo)}</td>
                      <td className="text-center" style={{ padding: '8px 4px' }}>
                        <span className={`badge ${av.aprobado === true ? 'badge-success' : av.aprobado === false ? 'badge-error' : 'badge-warning'}`} style={{ padding: '2px 6px' }}>
                          {av.aprobado === true ? '✓' : av.aprobado === false ? '✗' : '○'}
                        </span>
                      </td>
                      {actionCol > 0 && (
                        <td className="text-center">
                          {(isAdmin && isEnviado && av.aprobado === null) ? (
                            <div className="flex justify-center gap-1">
                              <button onClick={() => handleApprove(av)} className="btn btn-success btn-xs">✅</button>
                              <button onClick={() => handleReject(av)} className="btn btn-danger btn-xs">↩</button>
                            </div>
                          ) : canEdit && av.aprobado !== true ? (
                            <div className="flex justify-center gap-1">
                              {isLocked ? (
                                <>
                                  <button onClick={() => unlockPUCC(av)} className="btn btn-ghost btn-xs">✎</button>
                                  {av.itemId && <button onClick={() => deleteItem(av.itemId!)} className="btn btn-danger btn-xs">✕</button>}
                                </>
                              ) : (
                                <>
                                  <button onClick={() => saveBaseItem(av)} className="btn btn-primary btn-xs">💾</button>
                                  {av.itemId && <button onClick={() => deleteItem(av.itemId!)} className="btn btn-danger btn-xs">✕</button>}
                                </>
                              )}
                            </div>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {showNewItem && (
                  <tr>
                    <td colSpan={7 + actionCol} className="px-3 py-1.5" style={{ background: 'var(--color-accent-faint)' }}>
                      <div className="flex items-center gap-2">
                        <input type="number" value={editItem.numero} onChange={(e) => setEditItem({ ...editItem, numero: +e.target.value })} className="input input-sm w-14" placeholder="N°" />
                        <input value={editItem.descripcion} onChange={(e) => setEditItem({ ...editItem, descripcion: e.target.value })} className="input input-sm flex-1" placeholder="Descripción" />
                        <input value={editItem.unidad} onChange={(e) => setEditItem({ ...editItem, unidad: e.target.value })} className="input input-sm w-16" placeholder="Und" />
                        <button onClick={saveItem} className="btn btn-primary btn-xs">Guardar</button>
                        <button onClick={() => setEditItem(null)} className="btn btn-ghost btn-xs">Cancelar</button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          <tr style={{ background: 'var(--color-primary-faint)' }}>
            <td colSpan={3} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>TOTAL</td>
            <td colSpan={4 + actionCol} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{fmt(totalMO)}</td>
          </tr>
        </tbody>
      </table>

      {showCat && createPortal((
        <div className="dialog-backdrop">
          <div className="dialog animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="dialog-header">
              <h3>Importar del catálogo — DI</h3>
              <button onClick={() => setShowCat(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '1.125rem', lineHeight: 1, padding: '2px 8px' }}>&times;</button>
            </div>
            <input placeholder="Buscar rubro por nombre…" value={catSearch} onChange={e => setCatSearch(e.target.value)} className="input mx-4 mt-3" style={{ width: 'calc(100% - 32px)' }} />
            <div className="dialog-body space-y-1">
              {catRubros.filter(r => !catSearch || r.nombre.toLowerCase().includes(catSearch.toLowerCase())).map(r => (
                <div key={r.id} className="card" style={{ borderStyle: 'solid' }}>
                  <button onClick={() => { loadCatItems(r.id); setCatExpanded(p => ({ ...p, [r.id]: !p[r.id] })); }} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[var(--color-border-light)]">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-primary-light)' }}>{r.nombre}</span>
                    <span className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>{r._count.items} items {catExpanded[r.id] ? '▴' : '▾'}</span>
                  </button>
                  {catExpanded[r.id] && catItems[r.id] && (
                    <div style={{ borderTop: '1px solid var(--color-border-light)' }} className="px-3 py-1">
                      <label className="flex cursor-pointer items-center gap-2 py-1 text-xs" style={{ color: 'var(--color-primary-light)' }}
                        onClick={() => toggleAll(r.id, catItems[r.id])}>
                        <span className={`inline-block h-3 w-3 rounded border ${(catSel[r.id]?.size || 0) === catItems[r.id].length ? 'bg-blue-600 border-blue-600' : ''}`} style={{ borderColor: 'var(--color-border)' }} />
                        {catSel[r.id]?.size === catItems[r.id].length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                      </label>
                      {catItems[r.id].map((ci: any) => (
                        <label key={ci.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm hover:bg-[var(--color-border-light)]">
                          <input type="checkbox" checked={catSel[r.id]?.has(ci.id) || false} onChange={() => toggleSel(r.id, ci.id)} />
                          <span className="flex-1">{ci.descripcion}</span>
                          <span className="w-12 text-right text-xs" style={{ color: 'var(--color-ink-faint)' }}>{ci.unidad}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {catRubros.length === 0 && <p className="py-4 text-center text-sm" style={{ color: 'var(--color-ink-faint)' }}>Cargando…</p>}
            </div>
            <div className="dialog-footer">
              <span className="text-xs" style={{ color: 'var(--color-ink-muted)', alignSelf: 'center' }}>{Object.values(catSel).reduce((a, s) => a + s.size, 0)} items seleccionados</span>
              <button onClick={importar} disabled={!Object.values(catSel).some(s => s.size)} className="btn btn-primary">Importar seleccionados</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
});

function groupAvances(avs: Avance[]) {
  const map = new Map<string, { codigo: string; nombre: string; rubroId: number | null; avances: Avance[] }>();
  for (const a of avs) {
    const rubro = a.item?.rubro;
    const rc = a.rubroCodigo ?? rubro?.codigo ?? 'SIN';
    const rn = a.rubroNombre ?? rubro?.nombre ?? 'Sin Rubro';
    const rubroId = rubro?.id ?? null;
    const key = rubro ? `r${rubro.id}` : rc;
    if (!map.has(key)) map.set(key, { codigo: rc, nombre: rn, rubroId, avances: [] });
    map.get(key)!.avances.push(a);
  }
  return [...map.values()];
}

function CAOGrid({ planilla, isAdmin, isOper, isSupervisor, onRefresh, onOpenEvidencia }: {
  planilla: Planilla; isAdmin: boolean; isOper: boolean; isSupervisor: boolean;
  onRefresh: () => void; onOpenEvidencia: (avanceItemId: number) => void;
}) {
  const [editCant, setEditCant] = useState<Record<number, number>>({});
  const [savedCant, setSavedCant] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState<{ rubroCodigo: string; rubroNombre: string } | null>(null);

  const isBorrador = planilla.estado === 'borrador';
  const isEnviado = planilla.estado === 'enviado';
  const actionCol = (isAdmin && isEnviado) || (isBorrador && isOper) ? 1 : 0;
  const totalCols = 16 + actionCol;

  function cd(av: Avance) {
    return {
      pu: av.precioUnitario ?? av.item?.precioUnitario ?? 0,
      cc: av.cantidadContrato ?? av.item?.cantidadContrato ?? 1,
      mo: (av.precioUnitario ?? av.item?.precioUnitario ?? 0) * (av.cantidadContrato ?? av.item?.cantidadContrato ?? 1),
    };
  }
  function hist(av: Avance) {
    if (!av.itemId || !planilla.historico) return { cantidad: 0, monto: 0 };
    return planilla.historico[av.itemId] || { cantidad: 0, monto: 0 };
  }

  function getCant(av: Avance) { return editCant[av.id] !== undefined ? editCant[av.id] : av.cantidad; }

  async function saveCant(av: Avance) {
    const c = editCant[av.id];
    if (c === undefined) return;
    await fetch(`${API}/planillas/${planilla.id}/items`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ avanceId: av.id, itemId: av.itemId, cantidad: c }] }),
      credentials: 'include',
    });
    setEditCant((m) => { const n = { ...m }; delete n[av.id]; return n });
    setSavedCant(prev => new Set([...prev, av.id]));
    onRefresh();
  }

  function unlockCant(av: Avance) {
    const n = new Set(savedCant); n.delete(av.id); setSavedCant(n);
    setEditCant(m => ({ ...m, [av.id]: av.cantidad }));
  }

  async function removeItem(av: Avance) {
    if (!confirm('Eliminar este item de la planilla?')) return;
    await fetch(`${API}/planillas/${planilla.id}/items/${av.id}`, { method: 'DELETE', credentials: 'include' });
    onRefresh();
  }

  async function addItem() {
    if (!adding) return;
    await fetch(`${API}/planillas/${planilla.id}/items`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{
        itemId: null, cantidad: 0,
        descripcion: '', unidad: '',
        precioUnitario: 0, cantidadContrato: 0,
        rubroCodigo: adding.rubroCodigo, rubroNombre: adding.rubroNombre,
      }] }),
      credentials: 'include',
    });
    setAdding(null);
    onRefresh();
  }

  async function handleApprove(av: Avance) {
    await fetch(`${API}/planillas/${planilla.id}/aprobar-item/${av.id}`, { method: 'PATCH', credentials: 'include' });
    onRefresh();
  }

  async function handleReject(av: Avance) {
    await fetch(`${API}/planillas/${planilla.id}/rechazar-item/${av.id}`, { method: 'PATCH', credentials: 'include' });
    onRefresh();
  }

  const hasRejected = planilla.avances.some((a) => a.aprobado === false);
  const hasRecentApproval = planilla.estado === 'aprobado';

  const groups = groupAvances(planilla.avances);
  const grandContrato = planilla.avances.reduce((s, a) => s + cd(a).cc * cd(a).pu, 0);
  const grandAnterior = planilla.avances.reduce((s, a) => s + hist(a).monto, 0);
  const grandPresente = planilla.avances.reduce((s, a) => s + getCant(a) * cd(a).pu, 0);
  const grandAcumulado = grandAnterior + grandPresente;

  return (
    <>
      {hasRejected && (
        <div className="banner banner-warning" style={{ margin: '10px 16px' }}>
          El administrador ha rechazado algunos items. Revise y corrija los items marcados en rojo, luego vuelva a enviar la planilla.
        </div>
      )}
      {hasRecentApproval && (
        <div className="banner banner-success" style={{ margin: '10px 16px' }}>
          Planilla aprobada. Todos los items han sido verificados.
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th className="text-center" style={{ width: 44 }}>Ev.</th>
            <th className="text-center" colSpan={3}>Item</th>
            <th className="text-center" colSpan={3}>Según Contrato</th>
            <th className="text-center" colSpan={2}>Avance Anterior</th>
            <th className="text-center" colSpan={2}>Avance Presente</th>
            <th className="text-center" colSpan={2}>Avance Acumulado</th>
            <th className="text-center" colSpan={2}>% Avance</th>
            <th className="text-center" style={{ width: 40 }}>Est.</th>
            {actionCol > 0 && <th className="text-center">Acción</th>}
          </tr>
          <tr>
            <th></th>
            <th>N°</th>
            <th style={{ minWidth: 180 }}>Descripción</th>
            <th style={{ width: 36 }}>Und</th>
            <th className="text-right">P.Unit.</th>
            <th className="text-right">Cant.Cont.</th>
            <th className="text-right">M.Orig.</th>
            <th className="text-right">Cant.</th>
            <th className="text-right">Monto</th>
            <th className="text-right">Cant.</th>
            <th className="text-right">Monto</th>
            <th className="text-right">Cant.</th>
            <th className="text-right">Monto</th>
            <th className="text-right">Periodo</th>
            <th className="text-right">Fecha</th>
            <th style={{ width: 40 }}></th>
            {actionCol > 0 && <th></th>}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const contratoTotal = g.avances.reduce((s, a) => s + cd(a).cc * cd(a).pu, 0);
            const anteriorTotal = g.avances.reduce((s, a) => s + hist(a).monto, 0);
            const presenteTotal = g.avances.reduce((s, a) => s + getCant(a) * cd(a).pu, 0);
            const acumuladoTotal = anteriorTotal + presenteTotal;
            return (
            <Fragment key={g.rubroId ?? g.codigo}>
              <tr style={{ background: 'var(--color-primary-faint)' }}>
                <td colSpan={totalCols} className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>
                  {g.codigo} - {g.nombre}
                  {isBorrador && isOper && planilla.planillaBase?.estado !== 'aprobado' && <button onClick={() => setAdding({ rubroCodigo: g.codigo, rubroNombre: g.nombre })} className="btn btn-outline btn-xs ml-3">+ Item</button>}
                </td>
              </tr>
              {g.avances.map((av) => {
                const ev = (av as any).evidencia;
                const evEstado = ev?.mejorEstado || null;
                const evBadge = evEstado === 'VERIFICADO' ? '✓' : evEstado === 'SOSPECHOSO' ? '⚠' : evEstado === 'RECHAZADO' ? '✗' : ev?.count ? '?' : '○';
                const evColor = evEstado === 'VERIFICADO' ? 'var(--color-success)' : evEstado === 'SOSPECHOSO' ? 'var(--color-warning)' : evEstado === 'RECHAZADO' ? 'var(--color-error)' : 'var(--color-ink-faint)';
                const evBg = evEstado === 'VERIFICADO' ? 'var(--color-success-light)' : evEstado === 'SOSPECHOSO' ? 'var(--color-warning-light)' : evEstado === 'RECHAZADO' ? 'var(--color-error-light)' : 'transparent';
                const canEvidencia = av.itemId != null;
                const isDefaultOper = isBorrador && isOper;
                const showPlus = isDefaultOper && canEvidencia && (!ev || ev.count === 0);
                const c = cd(av);
                const h = hist(av);
                const cant = getCant(av);
                const isLockedCAO = savedCant.has(av.id);
                const montoPresente = cant * c.pu;
                const acumCant = h.cantidad + cant;
                const acumMonto = h.monto + montoPresente;
                const pctPeriodo = c.cc > 0 ? (cant / c.cc) * 100 : 0;
                const pctFecha = c.cc > 0 ? (acumCant / c.cc) * 100 : 0;
                const isPending = av.aprobado === null && planilla.estado !== 'borrador';
                const isRechazado = av.aprobado === false;
                return (
                  <tr key={av.id} data-rubro-codigo={g.codigo} className={isPending ? 'bg-yellow-50' : isRechazado ? 'bg-red-50' : ''}>
                    <td className="text-center" style={{ padding: '8px 4px' }}>
                      {canEvidencia ? (
                        <button
                          onClick={() => onOpenEvidencia(av.id)}
                          title={`${ev?.count || 0} fotos · ${evEstado || 'Sin evidencia'}`}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
                            color: evColor, background: evBg,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${evColor}`,
                          }}>
                          {showPlus ? '+' : evBadge}
                        </button>
                      ) : <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.7rem' }}>—</span>}
                    </td>
                    <td>{av.item?.numero ?? 'N'}</td>
                    <td>{av.descripcion ?? av.item?.descripcion ?? ''}</td>
                    <td style={{ padding: '8px 4px' }}>{av.unidad ?? av.item?.unidad ?? ''}</td>
                    <td className="text-right">{fmt(c.pu)}</td>
                    <td className="text-right">{fmt(c.cc)}</td>
                    <td className="text-right">{fmt(c.mo)}</td>
                    <td className="text-right">{fmt(h.cantidad)}</td>
                    <td className="text-right">{fmt(h.monto)}</td>
                    <td className="text-right">
                      {isBorrador && (isAdmin || isOper) && av.itemId && av.aprobado !== true && !isLockedCAO ? (
                        <input type="number" step="0.01" value={cant} onChange={(e) => setEditCant((m) => ({ ...m, [av.id]: +e.target.value }))}
                          className="input input-sm w-36 text-right" data-item-numero={av.item?.numero ?? 'N'} data-field="cantidad" />
                      ) : fmt(cant)}
                    </td>
                    <td className="text-right">{fmt(montoPresente)}</td>
                    <td className="text-right font-semibold">{fmt(acumCant)}</td>
                    <td className="text-right font-semibold">{fmt(acumMonto)}</td>
                    <td className={`text-right ${pctPeriodo >= 100 ? 'font-semibold' : ''}`} style={pctPeriodo >= 100 ? { color: 'var(--color-success)' } : {}}>{pctPeriodo.toFixed(1)}%</td>
                    <td className={`text-right ${pctFecha >= 100 ? 'font-semibold' : ''}`} style={pctFecha >= 100 ? { color: 'var(--color-success)' } : {}}>{pctFecha.toFixed(1)}%</td>
                    <td className="text-center" style={{ padding: '8px 4px' }}>
                      <span className={`badge ${av.aprobado === true ? 'badge-success' : av.aprobado === false ? 'badge-error' : 'badge-warning'}`} style={{ padding: '2px 6px' }}>
                        {av.aprobado === true ? '✓' : av.aprobado === false ? '✗' : '○'}
                      </span>
                    </td>
                    {(isAdmin && isEnviado) && (
                      <td className="text-center">
                        {av.aprobado === null && (
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleApprove(av)} className="btn btn-success btn-xs">✅</button>
                            <button onClick={() => handleReject(av)} className="btn btn-danger btn-xs">↩</button>
                          </div>
                        )}
                      </td>
                    )}
                    {isBorrador && (isAdmin || isOper) && av.aprobado !== true && (
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          {isLockedCAO ? (
                            <>
                              <button onClick={() => unlockCant(av)} className="btn btn-ghost btn-xs">✎</button>
                              <button onClick={() => removeItem(av)} className="btn btn-danger btn-xs">X</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => saveCant(av)} className="btn btn-primary btn-xs">💾</button>
                              <button onClick={() => removeItem(av)} className="btn btn-danger btn-xs">X</button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </Fragment>
            );
          })}
          <tr style={{ background: 'var(--color-primary-faint)' }}>
            <td colSpan={4} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>TOTAL</td>
            <td colSpan={4} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{fmt(grandContrato)}</td>
            <td colSpan={2} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{fmt(grandAnterior)}</td>
            <td colSpan={2} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{fmt(grandPresente)}</td>
            <td colSpan={2} className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{fmt(grandAcumulado)}</td>
            <td className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{grandContrato > 0 ? ((grandPresente / grandContrato) * 100).toFixed(1) : 0}%</td>
            <td className="text-right text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>{grandContrato > 0 ? ((grandAcumulado / grandContrato) * 100).toFixed(1) : 0}%</td>
            <td colSpan={1 + actionCol}></td>
          </tr>
          {isBorrador && isOper && (
            <tr>
              <td colSpan={totalCols} className="px-3 py-2">
                {adding ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>Nuevo Rubro:</span>
                    <input placeholder="Código" value={adding.rubroCodigo} onChange={(e) => setAdding({ ...adding, rubroCodigo: e.target.value })} className="input input-sm w-20" />
                    <input placeholder="Nombre" value={adding.rubroNombre} onChange={(e) => setAdding({ ...adding, rubroNombre: e.target.value })} className="input input-sm w-48" />
                    <button onClick={addItem} className="btn btn-primary btn-xs">Agregar</button>
                    <button onClick={() => setAdding(null)} className="btn btn-ghost btn-xs">Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => setAdding({ rubroCodigo: '', rubroNombre: '' })} className="btn btn-outline btn-xs">+ Nuevo Rubro</button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
