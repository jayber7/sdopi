'use client';

import { useState, useEffect, Fragment, forwardRef, useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import LlenadoAsistido from '../LlenadoAsistido';
import { mergeParsed } from '@/lib/proyecto-parser';
import { provincias, municipios } from '@/lib/municipios';
import { reverseNominatim } from '@/lib/osm-services';
import { EvidenciaStatsButton, PanelEvidencias, PanelGeneralEvidencias } from './PanelEvidencias';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const MapPicker = dynamic(() => import('../MapPicker'), { ssr: false });

const API = '/api';
const fmt = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2 });
const fdate = (d: string) => new Date(d).toLocaleDateString('es-BO');

interface BaseItem { id: number; numero: number; descripcion: string; unidad: string; precioUnitario: number; cantidadContrato: number; montoOriginal: number; rubroId: number }
interface Rubro { id: number; codigo: string; nombre: string; items: BaseItem[] }
interface EvidenciaInfo { count: number; mejorEstado: string | null; estados: string[]; }
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
  contratista: '', supervisor: '', fiscal: '', jefatura: 'DI',
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
      } else alert(err.message || 'Error');
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
    setHeaderForm({ periodo: planilla.periodo, fechaInicio: planilla.fechaInicio?.slice(0,10) || '', fechaFin: planilla.fechaFin?.slice(0,10) || '' });
    setEditHeader(true);
  }

  async function saveHeader() {
    if (!planilla) return;
    const r = await fetch(`${API}/planillas/${planilla.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(headerForm), credentials: 'include' });
    if (r.ok) { setPlanilla(await r.json()); setEditHeader(false); }
  }

  function openEdit() {
    if (!proyecto) return;
    const tieneCoords = proyecto.latitud !== null && proyecto.longitud !== null;
    setEditForm({
      nombre: proyecto.nombre, contratoNro: proyecto.contratoNro, montoContrato: proyecto.montoContrato,
      anticipoPct: proyecto.anticipoPct, ordenProceder: proyecto.ordenProceder?.slice(0,10) || '',
      fechaConclusion: proyecto.fechaConclusion?.slice(0,10) || '', suspendidoDias: proyecto.suspendidoDias,
      direccion: proyecto.direccion, latitud: tieneCoords ? String(proyecto.latitud) : '',
      longitud: tieneCoords ? String(proyecto.longitud) : '',
      provincia: proyecto.provincia || '', municipio: proyecto.municipio || '',
      contratista: proyecto.contratista, supervisor: proyecto.supervisor, fiscal: proyecto.fiscal, jefatura: proyecto.jefatura,
    });
    setEditModal(true);
  }

  async function saveEdit() {
    if (!proyecto) return;
    const f = editFormRef.current;
    const required: (keyof typeof f)[] = ['nombre','contratoNro','montoContrato','ordenProceder','fechaConclusion','direccion','contratista','supervisor','fiscal'];
    for (const k of required) { if (!f[k] && f[k] !== 0) { alert(`Campo requerido: ${k}`); return; } }
    if (!f.latitud || !f.longitud) { alert('Debe seleccionar una ubicación en el mapa'); return; }
    const body: any = { ...f, montoContrato: Number(f.montoContrato), anticipoPct: Number(f.anticipoPct), suspendidoDias: Number(f.suspendidoDias), latitud: Number(f.latitud), longitud: Number(f.longitud) };
    const r = await fetch(`${API}/proyectos/${proyecto.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
    if (!r.ok) { const t = await r.text().catch(() => ''); alert(`Error: ${t || r.statusText}`); return; }
    setProyecto(await r.json()); setEditModal(false);
  }

  async function desactivar() {
    if (!proyecto || !confirm(`Desactivar proyecto "${proyecto.nombre}"? Esta accion no se puede revertir.`)) return;
    const r = await fetch(`${API}/proyectos/${proyecto.id}`, { method: 'DELETE', credentials: 'include' });
    if (!r.ok) { alert('Error al desactivar'); return; }
    router.push('/proyectos');
  }

  async function createPlanilla() {
    if (!proyecto) return;
    const r = await fetch(`${API}/planillas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proyectoId: proyecto.id, numero: form.numero, periodo: form.periodo, fechaInicio: form.fechaInicio, fechaFin: form.fechaFin, tipo: form.tipo, planillaBaseId: form.tipo === 'CAO' ? proyecto.planillas.find(p => p.tipo === 'BASE')?.id : undefined }), credentials: 'include' });
    if (r.ok) {
      const p = await r.json();
      setShowForm(false); setForm({ numero: 0, periodo: '', fechaInicio: '', fechaFin: '', tipo: 'CAO' });
      setProyecto((prev) => prev ? { ...prev, planillas: [...prev.planillas, p] } : prev);
      loadPlanilla(p.id);
    } else { const err = await r.json().catch(() => ({ message: 'Error al crear planilla' })); alert(err.message || 'Error al crear planilla'); }
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

  const estadoChip = (estado: string) => {
    const map: Record<string, [string, 'warning' | 'info' | 'success' | 'default']> = {
      borrador: ['Borrador', 'warning'],
      enviado: ['Enviado', 'info'],
      aprobado: ['Aprobado', 'success'],
    };
    return map[estado] || [estado, 'default'];
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} sx={{ color: 'rgba(100,180,255,0.5)' }} /></Box>;
  if (!proyecto) return <Typography sx={{ color: 'rgba(255,107,107,0.8)', p: 4 }}>Proyecto no encontrado</Typography>;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        {/* Project header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>
                  {proyecto.nombre}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.3, color: 'rgba(150,200,255,0.5)' }}>
                  Contrato: {proyecto.contratoNro} · {proyecto.contratista}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(0,219,180,0.8)' }}>Bs {fmt(proyecto.montoContrato)}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>Sup: {proyecto.supervisor} · Fiscal: {proyecto.fiscal}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {(isAdmin || isOper) && <Button onClick={openEdit} startIcon={<EditIcon />} variant="outlined" size="small">Editar proyecto</Button>}
              {isAdmin && <Button onClick={desactivar} startIcon={<DeleteIcon />} variant="outlined" size="small" color="error">Desactivar proyecto</Button>}
              <Button onClick={() => window.open(`/reportes/${proyecto.id}`, '_blank')} startIcon={<AssessmentIcon />} variant="outlined" size="small">Reportes</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { minWidth: 120 } }}>
          <Tab label="General" value="general" />
          <Tab label={`Planillas (${proyecto.planillas.length})`} value="planillas" />
        </Tabs>

        {tab === 'general' && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: '0.875rem' }}>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Ubicación:</Box> {proyecto.latitud != null && proyecto.longitud != null ? `${proyecto.latitud}, ${proyecto.longitud}` : (proyecto.direccion || '—')}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Orden de Proceder:</Box> {fdate(proyecto.ordenProceder)}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Fecha Conclusión:</Box> {fdate(proyecto.fechaConclusion)}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Días Suspendido:</Box> {proyecto.suspendidoDias}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>% Anticipo:</Box> {proyecto.anticipoPct}%</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Jefatura:</Box> {proyecto.jefatura}</Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {tab === 'planillas' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Planilla selector */}
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)', fontWeight: 600, mr: 1 }}>Planillas:</Typography>
                {proyecto.planillas.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.tipo === 'BASE' ? 'BASE' : `N°${p.numero}`}
                    onClick={() => loadPlanilla(p.id)}
                    variant={planilla?.id === p.id ? 'filled' : 'outlined'}
                    color={planilla?.id === p.id ? (p.tipo === 'BASE' ? 'warning' : 'primary') : 'default'}
                    size="small"
                  />
                ))}
                {isBorrador && (isOper || isAdmin) && !showForm && (
                  <Chip icon={<AddIcon />} label="Nueva" onClick={() => setShowForm(true)} variant="outlined" size="small" sx={{ color: 'rgba(0,219,180,0.7)', borderColor: 'rgba(0,219,180,0.3)' }} />
                )}
              </CardContent>
            </Card>

            {/* Create planilla form */}
            {showForm && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 2, fontSize: '0.9375rem' }}>Nueva Planilla</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Chip label="CAO" onClick={() => setForm({ ...form, tipo: 'CAO' })} variant={form.tipo === 'CAO' ? 'filled' : 'outlined'} color={form.tipo === 'CAO' ? 'primary' : 'default'} size="small" />
                      <Chip label="BASE" onClick={() => setForm({ ...form, tipo: 'BASE' })} variant={form.tipo === 'BASE' ? 'filled' : 'outlined'} color={form.tipo === 'BASE' ? 'warning' : 'default'} size="small" />
                      {form.tipo === 'BASE' && proyecto.planillas.some(p => p.tipo === 'BASE') && <Chip label="Ya existe una Planilla Base" color="error" size="small" variant="filled" />}
                      {form.tipo === 'CAO' && !proyecto.planillas.some(p => p.tipo === 'BASE') && <Chip label="Primero debe crear una Planilla Base" color="warning" size="small" variant="filled" />}
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField label="Número" type="number" value={form.numero || ''} onChange={e => setForm({ ...form, numero: +e.target.value })} size="small" />
                      <TextField label="Período" value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })} size="small" />
                      <TextField label="Inicio" type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                      <TextField label="Fin" type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button onClick={createPlanilla} variant="contained" size="small" disabled={form.tipo === 'CAO' && !proyecto.planillas.some(p => p.tipo === 'BASE')}>Crear</Button>
                      <Button onClick={() => setShowForm(false)} variant="outlined" size="small">Cancelar</Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Planilla detail */}
            {planilla && (
              <Card>
                {/* Planilla header */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {isBase ? (
                      <Chip label="BASE" color="info" size="small" variant="filled" />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>CAO N&deg;{planilla.numero}</Typography>
                    )}
                    <Chip {...estadoChip(planilla.estado)} size="small" variant="filled" />
                    {!isBase && !editHeader && (
                      <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>
                        {planilla.periodo} ({fdate(planilla.fechaInicio)} — {fdate(planilla.fechaFin)})
                      </Typography>
                    )}
                    {!isBase && editHeader && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <TextField value={headerForm.periodo} onChange={e => setHeaderForm({ ...headerForm, periodo: e.target.value })} size="small" placeholder="Período" sx={{ width: 140 }} />
                        <TextField type="date" value={headerForm.fechaInicio} onChange={e => setHeaderForm({ ...headerForm, fechaInicio: e.target.value })} size="small" sx={{ width: 140 }} />
                        <TextField type="date" value={headerForm.fechaFin} onChange={e => setHeaderForm({ ...headerForm, fechaFin: e.target.value })} size="small" sx={{ width: 140 }} />
                        <Button onClick={saveHeader} size="small" variant="contained"><SaveIcon fontSize="small" /></Button>
                        <Button onClick={() => setEditHeader(false)} size="small" variant="text">Cancelar</Button>
                      </Box>
                    )}
                    {isBorrador && (isOper || isAdmin) && !editHeader && (
                      <Button onClick={startEditHeader} size="small" variant="text" sx={{ minWidth: 0 }}><EditIcon fontSize="small" /></Button>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {planilla?.tipo === 'CAO' && <EvidenciaStatsButton planillaId={planilla.id} onClick={() => setShowGeneralEvidencia(true)} />}
                    {isBorrador && (isOper || isAdmin) && (
                      <Button onClick={async () => { await puccRef.current?.saveAllPending(); await doEndpoint(`/planillas/${planilla.id}/enviar`); }} variant="contained" size="small" startIcon={<SendIcon />}>
                        Enviar
                      </Button>
                    )}
                    {isEnviado && isAdmin && <Button onClick={handleAprobarPlanilla} variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />}>Aprobar Todo</Button>}
                    {isEnviado && isAdmin && hasRejected && <Button onClick={() => doEndpoint(`/planillas/${planilla.id}/revisar`)} variant="outlined" color="warning" size="small" startIcon={<UndoIcon />}>Devolver</Button>}
                    {isAdmin && !isBase && <Button onClick={deletePlanilla} variant="outlined" color="error" size="small" startIcon={<DeleteIcon />}>Eliminar</Button>}
                  </Box>
                </Box>

                {/* Grid / content */}
                <Box sx={{ overflowX: 'auto' }}>
                  {isBase ? (
                    <BaseGrid ref={puccRef} planilla={planilla} isAdmin={isAdmin} isOper={isOper} onRefresh={() => loadPlanilla(planilla.id)} proyectoId={proyecto.id} rubros={proyecto.rubros}
                      onProjectRefresh={async () => { const r = await fetch(`${API}/proyectos/${proyecto.id}`, { credentials: 'include' }); if (r.ok) setProyecto(await r.json()); }} />
                  ) : <CAOGrid planilla={planilla} isAdmin={isAdmin} isOper={isOper} isSupervisor={isSupervisor} onRefresh={() => loadPlanilla(planilla.id)} onOpenEvidencia={(id) => setEvidenciaItemId(id)} />}
                </Box>
              </Card>
            )}
          </Box>
        )}

        {/* Evidence modals */}
        {evidenciaItemId != null && planilla && (
          <PanelEvidencias planilla={planilla} avanceItemId={evidenciaItemId} onClose={() => setEvidenciaItemId(null)} onRefresh={() => loadPlanilla(planilla.id)} />
        )}
        {showGeneralEvidencia && planilla && (
          <PanelGeneralEvidencias planilla={planilla} onClose={() => setShowGeneralEvidencia(false)} onOpenItem={(id) => { setShowGeneralEvidencia(false); setTimeout(() => setEvidenciaItemId(id), 50); }} />
        )}

        {/* Edit Modal */}
        {editModal && createPortal((
          <Dialog open={editModal} onClose={() => setEditModal(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.125rem' }}>Editar Proyecto</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
              <TextField label="Nombre del proyecto" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} size="small" fullWidth />
              <TextField label="N° Contrato" value={editForm.contratoNro} onChange={e => setEditForm({ ...editForm, contratoNro: e.target.value })} size="small" fullWidth />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Monto Contrato Bs" type="number" value={editForm.montoContrato || ''} onChange={e => setEditForm({ ...editForm, montoContrato: +e.target.value })} size="small" />
                <TextField label="% Anticipo" type="number" value={editForm.anticipoPct} onChange={e => setEditForm({ ...editForm, anticipoPct: +e.target.value })} size="small" />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Orden de Proceder" type="date" value={editForm.ordenProceder} onChange={e => setEditForm({ ...editForm, ordenProceder: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Fecha Conclusión" type="date" value={editForm.fechaConclusion} onChange={e => setEditForm({ ...editForm, fechaConclusion: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Días Suspendidos" type="number" value={editForm.suspendidoDias} onChange={e => setEditForm({ ...editForm, suspendidoDias: +e.target.value })} size="small" />
                <TextField select label="Jefatura" value={editForm.jefatura} onChange={e => setEditForm({ ...editForm, jefatura: e.target.value })} size="small">
                  {['DI','JE','JT','JUPRE','JUS'].map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField select label="Provincia" value={editForm.provincia} onChange={e => setEditForm({ ...editForm, provincia: e.target.value, municipio: '', latitud: '', longitud: '', direccion: '' })} size="small">
                  <MenuItem value="">Seleccionar provincia</MenuItem>
                  {provincias.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <TextField select label="Municipio" value={editForm.municipio} onChange={e => {
                  const m = municipios.find(m => m.nombre === e.target.value);
                  setEditForm(prev => ({ ...prev, municipio: e.target.value, latitud: m ? String(m.coords[0]) : prev.latitud, longitud: m ? String(m.coords[1]) : prev.longitud }));
                  if (m) reverseNominatim(m.coords[0], m.coords[1]).then(dir => { if (dir) setEditForm(prev => ({ ...prev, direccion: dir })); });
                }} size="small">
                  <MenuItem value="">Seleccionar municipio</MenuItem>
                  {municipios.filter(m => !editForm.provincia || m.provincia === editForm.provincia).map(m => <MenuItem key={m.id} value={m.nombre}>{m.nombre}</MenuItem>)}
                </TextField>
              </Box>
              <MapPicker lat={editForm.latitud ? parseFloat(editForm.latitud) : undefined} lng={editForm.longitud ? parseFloat(editForm.longitud) : undefined}
                onChange={(lat, lng) => setEditForm(prev => ({ ...prev, latitud: String(lat), longitud: String(lng) }))}
                onReverseGeocode={(dir) => setEditForm(prev => ({ ...prev, direccion: dir }))} />
              <TextField label="Contratista" value={editForm.contratista} onChange={e => setEditForm({ ...editForm, contratista: e.target.value })} size="small" fullWidth />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Supervisor" value={editForm.supervisor} onChange={e => setEditForm({ ...editForm, supervisor: e.target.value })} size="small" />
                <TextField label="Fiscal" value={editForm.fiscal} onChange={e => setEditForm({ ...editForm, fiscal: e.target.value })} size="small" />
              </Box>
              <LlenadoAsistido currentForm={editForm} onApply={(p) => setEditForm(mergeParsed(p, editForm) as any)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditModal(false)} variant="outlined">Cancelar</Button>
              <Button onClick={saveEdit} variant="contained">Guardar Cambios</Button>
            </DialogActions>
          </Dialog>
        ), document.body)}
      </Box>
    </Box>
  );
}

// ── BASE Grid ──
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

  function loadCatalogo() { fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' }).then(r => r.ok && r.json()).then(setCatRubros); }
  async function loadCatItems(id: number) { if (catItems[id]) return; const r = await fetch(`${API}/catalogo/rubros/${id}/items`, { credentials: 'include' }); if (r.ok) { const data = await r.json(); setCatItems(p => ({ ...p, [id]: data })); } }
  function toggleSel(rubroId: number, itemId: number) { setCatSel(p => { const s = new Set(p[rubroId] || []); s.has(itemId) ? s.delete(itemId) : s.add(itemId); return { ...p, [rubroId]: s }; }); }
  function toggleAll(rubroId: number, items: any[]) { setCatSel(p => { const s = new Set(p[rubroId] || []); items.forEach(i => s.has(i.id) ? s.delete(i.id) : s.add(i.id)); return { ...p, [rubroId]: s }; }); }
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
    try { if (editRubro.id) { await apiFetch('PATCH', `${API}/rubros/${editRubro.id}`, { codigo: editRubro.codigo, nombre: editRubro.nombre }); } else { await apiFetch('POST', `${API}/rubros`, { codigo: editRubro.codigo, nombre: editRubro.nombre, proyectoId }); } setEditRubro(null); await onProjectRefresh(); } catch {}
  }
  async function deleteRubro(id: number) { if (!confirm('Eliminar rubro y todos sus items?')) return; try { await apiFetch('DELETE', `${API}/rubros/${id}`); await onProjectRefresh(); await onRefresh(); } catch {} }
  async function saveItem() {
    if (!editItem) return;
    const body = { rubroId: editItem.rubroId, numero: editItem.numero, descripcion: editItem.descripcion, unidad: editItem.unidad };
    try { if (editItem.id) { await apiFetch('PATCH', `${API}/items/${editItem.id}`, body); } else { await apiFetch('POST', `${API}/items`, { ...body, precioUnitario: 0, cantidadContrato: 0 }); await fetch(`${API}/planillas/${planilla.id}/sync-from-items`, { method: 'PATCH', credentials: 'include' }); } setEditItem(null); await onProjectRefresh(); await onRefresh(); } catch {}
  }
  async function deleteItem(itemId: number) { if (!confirm('Eliminar item?')) return; try { await apiFetch('DELETE', `${API}/items/${itemId}`); await onProjectRefresh(); await onRefresh(); } catch {} }
  function getPU(av: Avance) { return editPU[av.id] !== undefined ? editPU[av.id] : av.precioUnitario ?? av.item?.precioUnitario ?? 0; }
  function getCC(av: Avance) { return editCC[av.id] !== undefined ? editCC[av.id] : av.cantidadContrato ?? av.item?.cantidadContrato ?? 1; }

  async function saveBaseItem(av: Avance) {
    const pu = editPU[av.id]; const cc = editCC[av.id];
    if (pu === undefined && cc === undefined) return;
    await fetch(`${API}/planillas/${planilla.id}/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ avanceId: av.id, itemId: av.itemId, ...(pu !== undefined ? { precioUnitario: pu } : {}), ...(cc !== undefined ? { cantidadContrato: cc } : {}), cantidad: 0 }] }), credentials: 'include' });
    const n1 = { ...editPU }; delete n1[av.id]; setEditPU(n1);
    const n2 = { ...editCC }; delete n2[av.id]; setEditCC(n2);
    setSaved(prev => new Set([...prev, av.id])); onRefresh();
  }

  async function saveAllPending() {
    if (!planilla) return;
    const ids = new Set([...Object.keys(editPU), ...Object.keys(editCC)]);
    if (!ids.size) return;
    const items = [...ids].map(id => { const av = planilla.avances.find(a => a.id === +id); if (!av) return null; const pu = editPU[av.id]; const cc = editCC[av.id]; if (pu === undefined && cc === undefined) return null; return { avanceId: av.id, itemId: av.itemId, ...(pu !== undefined ? { precioUnitario: pu } : {}), ...(cc !== undefined ? { cantidadContrato: cc } : {}), cantidad: 0 }; }).filter(Boolean);
    await fetch(`${API}/planillas/${planilla.id}/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }), credentials: 'include' });
    setEditPU({}); setEditCC({}); setSaved(new Set()); onRefresh();
  }
  useImperativeHandle(ref, () => ({ saveAllPending }), [editPU, editCC, planilla]);

  function unlockPUCC(av: Avance) { const n = new Set(saved); n.delete(av.id); setSaved(n); setEditPU(m => ({ ...m, [av.id]: av.precioUnitario ?? av.item?.precioUnitario ?? 0 })); setEditCC(m => ({ ...m, [av.id]: av.cantidadContrato ?? av.item?.cantidadContrato ?? 1 })); }
  async function handleApprove(av: Avance) { await fetch(`${API}/planillas/${planilla.id}/aprobar-item/${av.id}`, { method: 'PATCH', credentials: 'include' }); onRefresh(); }
  async function handleReject(av: Avance) { await fetch(`${API}/planillas/${planilla.id}/rechazar-item/${av.id}`, { method: 'PATCH', credentials: 'include' }); onRefresh(); }
  function findRubro(id: number | null, codigo: string) { return id ? rubros.find(r => r.id === id) : rubros.find(r => r.codigo === codigo); }
  function avanceCountInRubro(avs: Avance[], codigo: string) { return avs.filter(a => (a.rubroCodigo ?? a.item?.rubro?.codigo ?? 'SIN') === codigo).length; }

  const totalMO = planilla.avances.reduce((s, a) => s + getPU(a) * getCC(a), 0);
  const canManage = canEdit && (isAdmin || isOper);
  const t = { bg: 'rgba(91,154,255,0.08)', color: 'rgba(150,200,255,0.7)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <>
      {planilla.estado === 'aprobado' && (
        <Box sx={{ m: 2, p: 1.5, borderRadius: 2, background: 'rgba(91,154,255,0.12)', border: '1px solid rgba(91,154,255,0.2)', color: 'rgba(150,200,255,0.9)', fontSize: '0.8125rem' }}>
          Planilla Base aprobada — datos inmutables.
        </Box>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr>
            <th style={th}>N°</th>
            <th style={{ ...th, minWidth: 200 }}>Descripción</th>
            <th style={{ ...th, width: 36 }}>Und</th>
            <th style={{ ...th, textAlign: 'right' }}>Precio Unit.</th>
            <th style={{ ...th, textAlign: 'right' }}>Cant. Contrato</th>
            <th style={{ ...th, textAlign: 'right' }}>Monto Original</th>
            <th style={{ ...th, textAlign: 'center', width: 40 }}>Est.</th>
            {actionCol > 0 && <th style={{ ...th, textAlign: 'center' }}>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {groupAvances(planilla.avances).map((g) => {
            const rubro = findRubro(g.rubroId, g.codigo);
            const inEditRubro = editRubro !== null && editRubro?.id === rubro?.id;
            const showNewItem = editItem !== null && editItem?.rubroId === rubro?.id && !editItem?.id;
            return (
              <Fragment key={g.rubroId ?? g.codigo}>
                <tr><td colSpan={7 + actionCol} style={td}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, color: 'rgba(150,200,255,0.7)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(91,154,255,0.08)', px: 1, borderRadius: 1 }}>
                  <span>{g.codigo} — {g.nombre}</span>
                  {canManage && rubro && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" variant="text" sx={{ fontSize: '0.625rem', minWidth: 0 }} onClick={() => setEditRubro({ id: rubro.id, codigo: rubro.codigo, nombre: rubro.nombre })}>Editar</Button>
                      <Button size="small" variant="text" sx={{ fontSize: '0.625rem', minWidth: 0, color: 'rgba(255,107,107,0.7)' }} onClick={() => deleteRubro(rubro.id)}>Eliminar</Button>
                      <Button size="small" variant="text" sx={{ fontSize: '0.625rem', minWidth: 0 }} onClick={() => setEditItem({ rubroId: rubro.id, numero: avanceCountInRubro(planilla.avances, g.codigo) + 1, descripcion: '', unidad: '' })}>+ Item</Button>
                    </Box>
                  )}
                </Box></td></tr>
                {inEditRubro && (
                  <tr><td colSpan={7 + actionCol} style={td}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField value={editRubro!.codigo} onChange={e => setEditRubro({ ...editRubro!, codigo: e.target.value })} size="small" sx={{ width: 100 }} />
                      <TextField value={editRubro!.nombre} onChange={e => setEditRubro({ ...editRubro!, nombre: e.target.value })} size="small" sx={{ flex: 1 }} />
                      <Button onClick={saveRubro} size="small" variant="contained">Guardar</Button>
                      <Button onClick={() => setEditRubro(null)} size="small" variant="text">Cancelar</Button>
                    </Box>
                  </td></tr>
                )}
                {g.avances.map((av) => {
                  const pu = getPU(av); const cc = getCC(av); const mo = pu * cc;
                  const isLocked = saved.has(av.id);
                  return (
                    <tr key={av.id} style={av.aprobado === null && planilla.estado !== 'borrador' ? { background: 'rgba(255,180,0,0.05)' } : av.aprobado === false ? { background: 'rgba(255,80,80,0.05)' } : {}}>
                      <td style={td}>{av.item?.numero ?? 'N'}</td>
                      <td style={td}>{av.descripcion ?? av.item?.descripcion ?? ''}</td>
                      <td style={{ ...td, padding: '8px 4px' }}>{av.unidad ?? av.item?.unidad ?? ''}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {canEdit && av.aprobado !== true && !isLocked
                          ? <input type="number" step="0.01" value={pu} onChange={e => setEditPU(m => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm text-right" style={{ display: 'inline', width: 80 }} />
                          : fmt(pu)}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {canEdit && av.aprobado !== true && !isLocked
                          ? <input type="number" step="0.01" value={cc} onChange={e => setEditCC(m => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm text-right" style={{ display: 'inline', width: 80 }} />
                          : fmt(cc)}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(mo)}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <Chip label={av.aprobado === true ? '✓' : av.aprobado === false ? '✗' : '○'} size="small" color={av.aprobado === true ? 'success' : av.aprobado === false ? 'error' : 'warning'} variant="filled" sx={{ minWidth: 28, height: 22 }} />
                      </td>
                      {actionCol > 0 && (
                        <td style={{ ...td, textAlign: 'center' }}>
                          {(isAdmin && isEnviado && av.aprobado === null) ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '1rem', color: 'rgba(0,219,180,0.7)' }} onClick={() => handleApprove(av)}>✓</Button>
                              <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '1rem', color: 'rgba(255,107,107,0.7)' }} onClick={() => handleReject(av)}>↩</Button>
                            </Box>
                          ) : canEdit && av.aprobado !== true ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              {isLocked ? (
                                <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem' }} onClick={() => unlockPUCC(av)}>✎</Button>
                              ) : (
                                <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem', color: 'rgba(91,154,255,0.8)' }} onClick={() => saveBaseItem(av)}>💾</Button>
                              )}
                              {av.itemId && <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem', color: 'rgba(255,107,107,0.7)' }} onClick={() => deleteItem(av.itemId!)}>✕</Button>}
                            </Box>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {showNewItem && (
                  <tr><td colSpan={7 + actionCol} style={{ ...td, background: 'rgba(255,180,0,0.06)' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField type="number" value={editItem.numero} onChange={e => setEditItem({ ...editItem, numero: +e.target.value })} size="small" sx={{ width: 70 }} placeholder="N°" />
                      <TextField value={editItem.descripcion} onChange={e => setEditItem({ ...editItem, descripcion: e.target.value })} size="small" sx={{ flex: 1 }} placeholder="Descripción" />
                      <TextField value={editItem.unidad} onChange={e => setEditItem({ ...editItem, unidad: e.target.value })} size="small" sx={{ width: 80 }} placeholder="Und" />
                      <Button onClick={saveItem} size="small" variant="contained">Guardar</Button>
                      <Button onClick={() => setEditItem(null)} size="small" variant="text">Cancelar</Button>
                    </Box>
                  </td></tr>
                )}
              </Fragment>
            );
          })}
          <tr><td colSpan={3} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>TOTAL</td>
            <td colSpan={4 + actionCol} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{fmt(totalMO)}</td>
          </tr>
        </tbody>
      </table>

      {/* Catalog import modal */}
      {showCat && createPortal((
        <Dialog open={showCat} onClose={() => setShowCat(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem' }}>Importar del catálogo — DI</DialogTitle>
          <DialogContent>
            <TextField placeholder="Buscar rubro..." value={catSearch} onChange={e => setCatSearch(e.target.value)} size="small" fullWidth sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {catRubros.filter(r => !catSearch || r.nombre.toLowerCase().includes(catSearch.toLowerCase())).map(r => (
                <Card key={r.id} variant="outlined">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { background: 'rgba(100,180,255,0.05)' } }}
                    onClick={() => { loadCatItems(r.id); setCatExpanded(p => ({ ...p, [r.id]: !p[r.id] })); }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.nombre}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)' }}>{r._count.items} items {catExpanded[r.id] ? '▴' : '▾'}</Typography>
                  </Box>
                  {catExpanded[r.id] && catItems[r.id] && (
                    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', px: 2, py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 0.5, fontSize: '0.75rem', color: 'rgba(150,200,255,0.7)' }}
                        onClick={() => toggleAll(r.id, catItems[r.id])}>
                        <Box component="span" sx={{ width: 14, height: 14, borderRadius: 0.5, border: '1px solid rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', bgcolor: (catSel[r.id]?.size || 0) === catItems[r.id].length ? 'rgba(91,154,255,0.5)' : 'transparent' }} />
                        {catSel[r.id]?.size === catItems[r.id].length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                      </Box>
                      {catItems[r.id].map((ci: any) => (
                        <Box key={ci.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 0.5, '&:hover': { background: 'rgba(100,180,255,0.05)' } }} onClick={() => toggleSel(r.id, ci.id)}>
                          <input type="checkbox" checked={catSel[r.id]?.has(ci.id) || false} onChange={() => {}} style={{ accentColor: '#5b9aff' }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>{ci.descripcion}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)' }}>{ci.unidad}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Card>
              ))}
              {catRubros.length === 0 && <Typography sx={{ textAlign: 'center', py: 4, color: 'rgba(150,200,255,0.4)' }}>Cargando…</Typography>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Typography variant="caption" sx={{ flex: 1, ml: 1, color: 'rgba(150,200,255,0.5)' }}>{Object.values(catSel).reduce((a, s) => a + s.size, 0)} items seleccionados</Typography>
            <Button onClick={importar} variant="contained" disabled={!Object.values(catSel).some(s => s.size)}>Importar</Button>
          </DialogActions>
        </Dialog>
      ), document.body)}
    </>
  );
});

const th = { background: 'rgba(255,255,255,0.03)', color: 'rgba(150,200,255,0.7)', fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', whiteSpace: 'nowrap' as const };
const td = { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle' as const };

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

// ── CAO Grid ──
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

  function cd(av: Avance) { return { pu: av.precioUnitario ?? av.item?.precioUnitario ?? 0, cc: av.cantidadContrato ?? av.item?.cantidadContrato ?? 1, mo: (av.precioUnitario ?? av.item?.precioUnitario ?? 0) * (av.cantidadContrato ?? av.item?.cantidadContrato ?? 1) }; }
  function hist(av: Avance) { if (!av.itemId || !planilla.historico) return { cantidad: 0, monto: 0 }; return planilla.historico[av.itemId] || { cantidad: 0, monto: 0 }; }
  function getCant(av: Avance) { return editCant[av.id] !== undefined ? editCant[av.id] : av.cantidad; }

  async function saveCant(av: Avance) {
    const c = editCant[av.id]; if (c === undefined) return;
    await fetch(`${API}/planillas/${planilla.id}/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ avanceId: av.id, itemId: av.itemId, cantidad: c }] }), credentials: 'include' });
    setEditCant((m) => { const n = { ...m }; delete n[av.id]; return n }); setSavedCant(prev => new Set([...prev, av.id])); onRefresh();
  }
  function unlockCant(av: Avance) { const n = new Set(savedCant); n.delete(av.id); setSavedCant(n); setEditCant(m => ({ ...m, [av.id]: av.cantidad })); }
  async function removeItem(av: Avance) { if (!confirm('Eliminar este item de la planilla?')) return; await fetch(`${API}/planillas/${planilla.id}/items/${av.id}`, { method: 'DELETE', credentials: 'include' }); onRefresh(); }
  async function addItem() {
    if (!adding) return;
    await fetch(`${API}/planillas/${planilla.id}/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ itemId: null, cantidad: 0, descripcion: '', unidad: '', precioUnitario: 0, cantidadContrato: 0, rubroCodigo: adding.rubroCodigo, rubroNombre: adding.rubroNombre }] }), credentials: 'include' });
    setAdding(null); onRefresh();
  }
  async function handleApprove(av: Avance) { await fetch(`${API}/planillas/${planilla.id}/aprobar-item/${av.id}`, { method: 'PATCH', credentials: 'include' }); onRefresh(); }
  async function handleReject(av: Avance) { await fetch(`${API}/planillas/${planilla.id}/rechazar-item/${av.id}`, { method: 'PATCH', credentials: 'include' }); onRefresh(); }

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
        <Box sx={{ m: 2, p: 1.5, borderRadius: 2, background: 'rgba(255,180,0,0.12)', border: '1px solid rgba(255,180,0,0.2)', color: 'rgba(255,200,0,0.9)', fontSize: '0.8125rem' }}>
          El administrador ha rechazado algunos items. Revise y corrija los items marcados en rojo, luego vuelva a enviar la planilla.
        </Box>
      )}
      {hasRecentApproval && (
        <Box sx={{ m: 2, p: 1.5, borderRadius: 2, background: 'rgba(0,219,180,0.12)', border: '1px solid rgba(0,219,180,0.2)', color: 'rgba(0,219,180,0.9)', fontSize: '0.8125rem' }}>
          Planilla aprobada. Todos los items han sido verificados.
        </Box>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'center', width: 44 }}>Ev.</th>
            <th style={th} colSpan={3}>Item</th>
            <th style={th} colSpan={3}>Según Contrato</th>
            <th style={th} colSpan={2}>Avance Anterior</th>
            <th style={th} colSpan={2}>Avance Presente</th>
            <th style={th} colSpan={2}>Avance Acumulado</th>
            <th style={th} colSpan={2}>% Avance</th>
            <th style={{ ...th, textAlign: 'center', width: 40 }}>Est.</th>
            {actionCol > 0 && <th style={th}>Acción</th>}
          </tr>
          <tr>
            <th style={th}></th>
            <th style={th}>N°</th>
            <th style={{ ...th, minWidth: 180 }}>Descripción</th>
            <th style={{ ...th, width: 36 }}>Und</th>
            <th style={{ ...th, textAlign: 'right' }}>P.Unit.</th>
            <th style={{ ...th, textAlign: 'right' }}>Cant.Cont.</th>
            <th style={{ ...th, textAlign: 'right' }}>M.Orig.</th>
            <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
            <th style={{ ...th, textAlign: 'right' }}>Monto</th>
            <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
            <th style={{ ...th, textAlign: 'right' }}>Monto</th>
            <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
            <th style={{ ...th, textAlign: 'right' }}>Monto</th>
            <th style={{ ...th, textAlign: 'right' }}>Período</th>
            <th style={{ ...th, textAlign: 'right' }}>Fecha</th>
            <th style={{ ...th, width: 40 }}></th>
            {actionCol > 0 && <th style={th}></th>}
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
                <tr><td colSpan={totalCols} style={{ ...td, background: 'rgba(91,154,255,0.08)', fontWeight: 600, color: 'rgba(150,200,255,0.7)', fontSize: '0.75rem', padding: '4px 12px' }}>
                  {g.codigo} — {g.nombre}
                  {isBorrador && isOper && planilla.planillaBase?.estado !== 'aprobado' && (
                    <Button size="small" variant="text" sx={{ ml: 2, fontSize: '0.625rem', minWidth: 0 }} onClick={() => setAdding({ rubroCodigo: g.codigo, rubroNombre: g.nombre })}>+ Item</Button>
                  )}
                </td></tr>
                {g.avances.map((av) => {
                  const ev = (av as any).evidencia;
                  const evEstado = ev?.mejorEstado || null;
                  const evBadge = evEstado === 'VERIFICADO' ? '✓' : evEstado === 'SOSPECHOSO' ? '⚠' : evEstado === 'RECHAZADO' ? '✗' : ev?.count ? '?' : '○';
                  const evColor = evEstado === 'VERIFICADO' ? 'rgba(0,219,180,0.8)' : evEstado === 'SOSPECHOSO' ? 'rgba(255,180,0,0.8)' : evEstado === 'RECHAZADO' ? 'rgba(255,107,107,0.8)' : 'rgba(150,200,255,0.4)';
                  const canEvidencia = av.itemId != null;
                  const isDefaultOper = isBorrador && isOper;
                  const showPlus = isDefaultOper && canEvidencia && (!ev || ev.count === 0);
                  const c = cd(av); const h = hist(av); const cant = getCant(av);
                  const isLockedCAO = savedCant.has(av.id);
                  const montoPresente = cant * c.pu; const acumCant = h.cantidad + cant; const acumMonto = h.monto + montoPresente;
                  const pctPeriodo = c.cc > 0 ? (cant / c.cc) * 100 : 0; const pctFecha = c.cc > 0 ? (acumCant / c.cc) * 100 : 0;
                  const isRechazado = av.aprobado === false;
                  return (
                    <tr key={av.id} style={av.aprobado === null && planilla.estado !== 'borrador' ? { background: 'rgba(255,180,0,0.05)' } : isRechazado ? { background: 'rgba(255,80,80,0.05)' } : {}}>
                      <td style={{ ...td, textAlign: 'center', padding: '8px 4px' }}>
                        {canEvidencia ? (
                          <Box component="button" onClick={() => onOpenEvidencia(av.id)} title={`${ev?.count || 0} fotos · ${evEstado || 'Sin evidencia'}`}
                            sx={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', color: evColor, background: 'rgba(255,255,255,0.04)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: evColor }}>
                            {showPlus ? '+' : evBadge}
                          </Box>
                        ) : <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.35)' }}>—</Typography>}
                      </td>
                      <td style={td}>{av.item?.numero ?? 'N'}</td>
                      <td style={td}>{av.descripcion ?? av.item?.descripcion ?? ''}</td>
                      <td style={{ ...td, padding: '8px 4px' }}>{av.unidad ?? av.item?.unidad ?? ''}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(c.pu)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(c.cc)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(c.mo)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(h.cantidad)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(h.monto)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {isBorrador && (isAdmin || isOper) && av.itemId && av.aprobado !== true && !isLockedCAO ? (
                          <input type="number" step="0.01" value={cant} onChange={e => setEditCant(m => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm text-right" style={{ display: 'inline', width: 100 }} />
                        ) : fmt(cant)}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(montoPresente)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(acumCant)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(acumMonto)}</td>
                      <td style={{ ...td, textAlign: 'right', ...(pctPeriodo >= 100 ? { fontWeight: 600, color: 'rgba(0,219,180,0.8)' } : {}) }}>{pctPeriodo.toFixed(1)}%</td>
                      <td style={{ ...td, textAlign: 'right', ...(pctFecha >= 100 ? { fontWeight: 600, color: 'rgba(0,219,180,0.8)' } : {}) }}>{pctFecha.toFixed(1)}%</td>
                      <td style={{ ...td, textAlign: 'center', padding: '8px 4px' }}>
                        <Chip label={av.aprobado === true ? '✓' : av.aprobado === false ? '✗' : '○'} size="small" color={av.aprobado === true ? 'success' : av.aprobado === false ? 'error' : 'warning'} variant="filled" sx={{ minWidth: 28, height: 22 }} />
                      </td>
                      {(isAdmin && isEnviado) && (
                        <td style={{ ...td, textAlign: 'center' }}>
                          {av.aprobado === null && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '1rem', color: 'rgba(0,219,180,0.7)' }} onClick={() => handleApprove(av)}>✓</Button>
                              <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '1rem', color: 'rgba(255,107,107,0.7)' }} onClick={() => handleReject(av)}>↩</Button>
                            </Box>
                          )}
                        </td>
                      )}
                      {isBorrador && (isAdmin || isOper) && av.aprobado !== true && (
                        <td style={{ ...td, textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            {isLockedCAO ? (
                              <>
                                <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem' }} onClick={() => unlockCant(av)}>✎</Button>
                                <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem', color: 'rgba(255,107,107,0.7)' }} onClick={() => removeItem(av)}>X</Button>
                              </>
                            ) : (
                              <>
                                <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem', color: 'rgba(91,154,255,0.8)' }} onClick={() => saveCant(av)}>💾</Button>
                                <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem', color: 'rgba(255,107,107,0.7)' }} onClick={() => removeItem(av)}>X</Button>
                              </>
                            )}
                          </Box>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
          <tr><td colSpan={4} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>TOTAL</td>
            <td colSpan={4} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{fmt(grandContrato)}</td>
            <td colSpan={2} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{fmt(grandAnterior)}</td>
            <td colSpan={2} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{fmt(grandPresente)}</td>
            <td colSpan={2} style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{fmt(grandAcumulado)}</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{(grandContrato > 0 ? ((grandPresente / grandContrato) * 100).toFixed(1) : 0)}%</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: 'rgba(150,200,255,0.7)' }}>{(grandContrato > 0 ? ((grandAcumulado / grandContrato) * 100).toFixed(1) : 0)}%</td>
            <td colSpan={1 + actionCol}></td>
          </tr>
          {isBorrador && isOper && (
            <tr><td colSpan={totalCols} style={td}>
              {adding ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField value={adding.rubroCodigo} onChange={e => setAdding({ ...adding, rubroCodigo: e.target.value })} size="small" sx={{ width: 100 }} placeholder="Código" />
                  <TextField value={adding.rubroNombre} onChange={e => setAdding({ ...adding, rubroNombre: e.target.value })} size="small" sx={{ width: 200 }} placeholder="Nombre" />
                  <Button onClick={addItem} size="small" variant="contained">Agregar</Button>
                  <Button onClick={() => setAdding(null)} size="small" variant="text">Cancelar</Button>
                </Box>
              ) : (
                <Button onClick={() => setAdding({ rubroCodigo: '', rubroNombre: '' })} size="small" variant="outlined" startIcon={<AddIcon />}>Nuevo Rubro</Button>
              )}
            </td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}
