'use client';

import { useState, useEffect, Fragment, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { can } from '@/lib/permissions';
import { useJefatura } from '@/context/JefaturaContext';
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
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from '@mui/material/Autocomplete';

const MapPicker = dynamic(() => import('../MapPicker'), { ssr: false });

const API = '/api';
const fmt = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  enviadoPor?: string; enviadoEn?: string;
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
  situacion: '',
};

const ETAPA_LABEL: Record<string, string> = {
  SIN_EJECUCION: 'Sin Ejecución', PREINVERSION: 'Preinversión', INVERSION: 'Inversión',
  CAMBIO_PREINVERSION_A_INVERSION: 'Cambio a Inversión', INVERSION_PARA_LICITACION: 'Inversión para Licitación',
  EDTP_CONCLUIDO: 'EDTP Concluido', EDTP_CONCLUIDO_ESPERA_INVERSION: 'EDTP Concluido (espera inversión)',
  EN_EJECUCION: 'En Ejecución', EN_CIERRE: 'En Cierre', CONCLUIDO: 'Concluido',
  CON_ENTREGA_DEFINITIVA: 'Con Entrega Definitiva', CONCILIACION_SALDOS: 'Conciliación de Saldos',
  AUDITORIA_EXTERNA: 'Auditoría Externa', SUSPENSION_CONTRATACION: 'Suspensión de Contratación',
};

export default function ProyectoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { jefatura: jefaturaActual } = useJefatura();
  const { user } = useAuth();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const [tab, setTab] = useState<'general' | 'planillas' | 'boletas' | 'dashboard'>('planillas');
  const [showForm, setShowForm] = useState(false);
  const [boletas, setBoletas] = useState<any[]>([]);
  const [boletaEditando, setBoletaEditando] = useState<number | null>(null);
  const [boletaCreando, setBoletaCreando] = useState(false);
  const [boletaForm, setBoletaForm] = useState({ numero: '', fecha: '', vigencia: '', vencimiento: '' });
  const [editMontoDisplay, setEditMontoDisplay] = useState('');

  const thBoleta = { background: 'rgba(255,255,255,0.03)', color: 'rgba(150,200,255,0.7)', fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', whiteSpace: 'nowrap' as const };
  const tdBoleta = { padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle' as const };

  const fechaLiteral = (d: string) => new Date(d).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });

  async function fetchBoletas() {
    if (!proyecto) return;
    const r = await fetch(`/api/boletas?proyectoId=${proyecto.id}`, { credentials: 'include' });
    if (r.ok) setBoletas(await r.json());
  }

  async function initNewBoleta() {
    if (!proyecto) return;
    const r = await fetch(`/api/boletas/next-numero?proyectoId=${proyecto.id}`, { credentials: 'include' });
    const { numero } = r.ok ? await r.json() : { numero: 'BG-0001' };
    setBoletaForm({ numero, fecha: '', vigencia: '', vencimiento: '' });
    setBoletaCreando(true);
  }

  async function createBoleta() {
    if (!proyecto) return;
    const r = await fetch('/api/boletas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectoId: proyecto.id, ...boletaForm }), credentials: 'include',
    });
    if (r.ok) { await fetchBoletas(); setBoletaCreando(false); }
    else { const err = await r.json().catch(() => ({ message: 'Error' })); alert(err.message); }
  }

  function startEditBoleta(b: any) {
    setBoletaForm({ numero: b.numero, fecha: b.fecha.slice(0, 10), vigencia: b.vigencia.slice(0, 10), vencimiento: b.vencimiento.slice(0, 10) });
    setBoletaEditando(b.id);
  }

  async function updateBoleta(id: number) {
    const r = await fetch(`/api/boletas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boletaForm), credentials: 'include',
    });
    if (r.ok) { await fetchBoletas(); setBoletaEditando(null); }
    else { const err = await r.json().catch(() => ({ message: 'Error' })); alert(err.message); }
  }

  async function deleteBoleta(id: number) {
    const r = await fetch(`/api/boletas/${id}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) await fetchBoletas();
  }

  const dashboardContent = useMemo(() => {
    if (!proyecto) return null;
    const items = (proyecto.rubros?.flatMap(r => r.items || []) || []) as any[];
    const totalItems = items.length;
    const itemsConAvance = items.filter((i: any) => i.avances?.some((a: any) => a.cantidad > 0)).length;
    const planillasCAO = (proyecto.planillas || []).filter(p => p.tipo !== 'BASE');
    const planillasPorEstado: Record<string, number> = {};
    for (const p of planillasCAO) planillasPorEstado[p.estado] = (planillasPorEstado[p.estado] || 0) + 1;
    const montoTotal = items.reduce((s: number, i: any) => s + (i.montoOriginal || 0), 0);
    const montoEjecutado = items.reduce((s: number, i: any) => s + (i.avances?.reduce((a: number, av: any) => a + (av.monto || 0), 0) || 0), 0);
    const avanceFisico = montoTotal > 0 ? (montoEjecutado / montoTotal * 100) : 0;
    const anticipoPct = proyecto.anticipoPct / 100;
    const montoLiquido = anticipoPct * proyecto.montoContrato + montoEjecutado * (1 - anticipoPct);
    const avanceFinanciero = proyecto.montoContrato > 0 ? (montoLiquido / proyecto.montoContrato * 100) : 0;
    const saldo = proyecto.montoContrato - montoEjecutado;
    const diasTranscurridos = proyecto.ordenProceder ? Math.floor((Date.now() - new Date(proyecto.ordenProceder).getTime()) / 86400000) : 0;
    const diasTotales = (proyecto.ordenProceder && proyecto.fechaConclusion) ? Math.floor((new Date(proyecto.fechaConclusion).getTime() - new Date(proyecto.ordenProceder).getTime()) / 86400000) : 0;
    const tiempoPct = diasTotales > 0 ? (diasTranscurridos / diasTotales * 100) : 0;
    const kpiStyle = { p: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.02)' };
    const labelSx = { color: 'rgba(150,200,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
    const valueSx = { fontSize: '1.25rem', fontWeight: 700, mt: 0.25 };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          <Box sx={kpiStyle}><Typography sx={labelSx}>Avance Físico</Typography><Typography sx={{ ...valueSx, color: avanceFisico > 80 ? '#81c784' : avanceFisico > 40 ? '#ffb74d' : '#ef5350' }}>{avanceFisico.toFixed(2)}%</Typography></Box>
          <Box sx={kpiStyle}><Typography sx={labelSx}>Avance Financiero</Typography><Typography sx={valueSx}>Bs {fmt(montoEjecutado)}</Typography><Typography sx={{ fontSize: '0.7rem', color: 'rgba(150,200,255,0.35)' }}>de Bs {fmt(proyecto.montoContrato)}</Typography></Box>
          <Box sx={kpiStyle}><Typography sx={labelSx}>Saldo por Ejecutar</Typography><Typography sx={{ ...valueSx, color: saldo < 0 ? '#ef5350' : '#4fc3f7' }}>Bs {fmt(Math.max(0, saldo))}</Typography></Box>
          <Box sx={kpiStyle}><Typography sx={labelSx}>Tiempo</Typography><Typography sx={{ ...valueSx, color: tiempoPct > 100 ? '#ef5350' : '#4fc3f7' }}>{tiempoPct.toFixed(0)}%</Typography><Typography sx={{ fontSize: '0.7rem', color: 'rgba(150,200,255,0.35)' }}>{diasTranscurridos}/{diasTotales} días</Typography></Box>
          <Box sx={kpiStyle}><Typography sx={labelSx}>Items</Typography><Typography sx={valueSx}>{itemsConAvance}/{totalItems}</Typography><Typography sx={{ fontSize: '0.7rem', color: 'rgba(150,200,255,0.35)' }}>con avance</Typography></Box>
          <Box sx={kpiStyle}><Typography sx={labelSx}>Anticipo</Typography><Typography sx={valueSx}>{proyecto.anticipoPct}%</Typography><Typography sx={{ fontSize: '0.7rem', color: 'rgba(150,200,255,0.35)' }}>Días suspendidos: {proyecto.suspendidoDias}</Typography></Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box sx={kpiStyle}>
            <Typography sx={labelSx}>Avance Físico</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[
                  { name: 'Ejecutado', value: Math.round(montoEjecutado * 100) / 100 },
                  { name: 'Pendiente', value: Math.round(Math.max(0, montoTotal - montoEjecutado) * 100) / 100 },
                ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="#4fc3f7" />
                  <Cell fill="rgba(150,200,255,0.12)" />
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" fill="rgba(150,200,255,0.9)" fontSize="1.3rem" fontWeight={700}>{avanceFisico.toFixed(1)}%</text>
                <text x="50%" y="60%" textAnchor="middle" fill="rgba(150,200,255,0.35)" fontSize="0.65rem">ejecutado</text>
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={kpiStyle}>
            <Typography sx={labelSx}>Avance Financiero</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[
                  { name: 'Ejecutado', value: Math.round(montoLiquido * 100) / 100 },
                  { name: 'Saldo', value: Math.round(Math.max(0, proyecto.montoContrato - montoLiquido) * 100) / 100 },
                ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="#66bb6a" />
                  <Cell fill="rgba(150,200,255,0.12)" />
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" fill="rgba(150,200,255,0.9)" fontSize="1.3rem" fontWeight={700}>{avanceFinanciero.toFixed(1)}%</text>
                <text x="50%" y="60%" textAnchor="middle" fill="rgba(150,200,255,0.35)" fontSize="0.65rem">ejecutado</text>
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
    );
  }, [proyecto]);
  const [form, setForm] = useState({ numero: 0, periodo: '', fechaInicio: '', fechaFin: '', tipo: 'CAO' as 'BASE' | 'CAO' });
  const [showManualCao, setShowManualCao] = useState(false);
  const [manualCaoForm, setManualCaoForm] = useState({ numero: 1, periodo: '', fechaInicio: '', fechaFin: '' });
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...INIT_FORM });
  const editFormRef = useRef(editForm);
  useEffect(() => { editFormRef.current = editForm; }, [editForm]);
  useEffect(() => { if (proyecto && proyecto.jefatura !== jefaturaActual) router.push('/proyectos'); }, [jefaturaActual, proyecto, router]);
  const [editHeader, setEditHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ periodo: '', fechaInicio: '', fechaFin: '' });
  const puccRef = useRef<{ saveAllPending: () => Promise<void> }>(null);
  const [evidenciaItemId, setEvidenciaItemId] = useState<number | null>(null);
  const [showGeneralEvidencia, setShowGeneralEvidencia] = useState(false);

  const canPUpdate = can(user, 'proyectos', 'update');
  const canPDelete = can(user, 'proyectos', 'delete');
  const canPCreate = can(user, 'planillas', 'create') || user?.role === 'admin';
  const canPUpdate2 = can(user, 'planillas', 'update') || user?.role === 'admin';
  const canAprobar = can(user, 'planillas', 'aprobar');
  const canPDelete2 = can(user, 'planillas', 'delete');
  const canEVerificar = can(user, 'evidencias', 'verificar');
  const canECreate = can(user, 'evidencias', 'create');
  const isOper = canPUpdate2 || canPCreate || canPUpdate || canECreate;
  const canEditPlanilla = canPUpdate2 || canPCreate;
  const isAdmin = canAprobar || canPDelete2 || canPDelete;
  const isSupervisor = canEVerificar || canAprobar;
  const isBorrador = planilla?.estado === 'borrador';
  const isEnviado = planilla?.estado === 'enviado';
  const isBase = planilla?.tipo === 'BASE';
  const hasRejected = planilla?.avances?.some((a) => a.aprobado === false) ?? false;

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    fetch(`${API}/proyectos/${id}`, { credentials: 'include', signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (p) => {
        setProyecto(p);
        if (p?.planillas?.length) {
          const planillaId = searchParams.get('planilla');
          const target = planillaId ? p.planillas.find((pl: any) => pl.id === Number(planillaId)) : null;
          loadPlanilla(target ? target.id : p.planillas[0].id);
        }
      })
      .catch((e) => { if (e.name !== 'AbortError') console.error(e); })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [params?.id]);

  useEffect(() => { if (tab === 'boletas' && proyecto) fetchBoletas(); }, [tab, proyecto]);

  async function loadPlanilla(id: number) {
    const r = await fetch(`${API}/planillas/${id}`, { credentials: 'include' });
    if (r.ok) setPlanilla(await r.json());
  }

  async function handleAprobarPlanilla() {
    if (!planilla) return;
    if (!confirm('¿Estás seguro de aprobar todos los items? Esta acción no se puede deshacer.')) return;
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
      situacion: proyecto.situacion || '',
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

  async function createManualCao() {
    if (!proyecto) return;
    const base = proyecto.planillas.find(p => p.tipo === 'BASE');
    if (!base) { alert('No hay una Planilla Base'); return; }
    const r = await fetch(`${API}/planillas/manual-cao`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectoId: proyecto.id, planillaBaseId: base.id, ...manualCaoForm }),
      credentials: 'include',
    });
    if (r.ok) {
      const p = await r.json();
      setShowManualCao(false); setManualCaoForm({ numero: 1, periodo: '', fechaInicio: '', fechaFin: '' });
      setProyecto((prev) => prev ? { ...prev, planillas: [...prev.planillas, p] } : prev);
      loadPlanilla(p.id);
    } else { const err = await r.json().catch(() => ({ message: 'Error al crear CAO' })); alert(err.message || 'Error al crear CAO'); }
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
    const map: Record<string, { label: string; color: 'warning' | 'info' | 'success' | 'default' }> = {
      borrador: { label: 'Borrador', color: 'warning' },
      enviado: { label: 'Enviado', color: 'info' },
      aprobado: { label: 'Aprobado', color: 'success' },
    };
    return map[estado] || { label: estado, color: 'default' };
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} sx={{ color: 'rgba(100,180,255,0.5)' }} /></Box>;
  if (!proyecto) return <Typography sx={{ color: 'rgba(255,107,107,0.8)', p: 4 }}>Proyecto no encontrado</Typography>;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
        {/* Project header */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="h5" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {proyecto.nombre}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(0,219,180,0.8)', flexShrink: 0 }}>Bs {fmt(proyecto.montoContrato)}</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => { if (v === 'reportes') { router.push(`/reportes/${proyecto.id}`); } else { setTab(v); } }} sx={{ mb: 3, minHeight: 36, '& .MuiTab-root': { minWidth: 100, py: 0.5, minHeight: 36 }, '& .Mui-selected': { bgcolor: 'rgba(100,180,255,0.1)', borderRadius: 1 } }}>
          <Tab label="General" value="general" />
          <Tab label={`Planillas (${proyecto.planillas.length})`} value="planillas" />
          <Tab label="Boletas" value="boletas" />
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Reportes" value="reportes" />
        </Tabs>

        {tab === 'general' && (
          <Card>
            <CardContent sx={{ py: 0.5, '&:last-child': { pb: 0.5 } }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, fontSize: '0.875rem' }}>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Ubicación:</Box> {proyecto.latitud != null && proyecto.longitud != null ? `${proyecto.latitud}, ${proyecto.longitud}` : (proyecto.direccion || '—')}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Orden de Proceder:</Box> {fdate(proyecto.ordenProceder)}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Fecha Conclusión:</Box> {fdate(proyecto.fechaConclusion)}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Días Suspendido:</Box> {proyecto.suspendidoDias}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>% Anticipo:</Box> {proyecto.anticipoPct}%</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Jefatura:</Box> {proyecto.jefatura}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Contrato:</Box> {proyecto.contratoNro} · {proyecto.contratista}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Supervisor:</Box> {proyecto.supervisor}</Typography>
                <Typography variant="body2"><Box component="span" sx={{ color: 'rgba(150,200,255,0.5)' }}>Fiscal:</Box> {proyecto.fiscal}</Typography>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                {(isAdmin || isOper) && <Button onClick={openEdit} startIcon={<EditIcon />} variant="outlined" size="small">Editar proyecto</Button>}
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
                {(isBorrador || !proyecto.planillas.some(p => p.tipo === 'BASE')) && canPCreate && !showForm && (
                  <Chip icon={<AddIcon />} label="Nueva" onClick={() => setShowForm(true)} variant="outlined" size="small" sx={{ color: 'rgba(0,219,180,0.7)', borderColor: 'rgba(0,219,180,0.3)' }} />
                )}
                {isAdmin && !showManualCao && (
                  <Chip label="CAO Manual" onClick={() => setShowManualCao(true)} variant="outlined" size="small" sx={{ color: 'rgba(255,180,0,0.7)', borderColor: 'rgba(255,180,0,0.3)' }} />
                )}
              </CardContent>
            </Card>

            {/* Manual CAO dialog */}
            <Dialog open={showManualCao} onClose={() => setShowManualCao(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem' }}>Crear CAO Manual</DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                <TextField label="Número" type="number" value={manualCaoForm.numero} onChange={e => setManualCaoForm({ ...manualCaoForm, numero: +e.target.value })} size="small" />
                <TextField label="Período" value={manualCaoForm.periodo} onChange={e => setManualCaoForm({ ...manualCaoForm, periodo: e.target.value })} size="small" />
                <TextField label="Inicio" type="date" value={manualCaoForm.fechaInicio} onChange={e => setManualCaoForm({ ...manualCaoForm, fechaInicio: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Fin" type="date" value={manualCaoForm.fechaFin} onChange={e => setManualCaoForm({ ...manualCaoForm, fechaFin: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowManualCao(false)} variant="outlined">Cancelar</Button>
                <Button onClick={createManualCao} variant="contained">Crear</Button>
              </DialogActions>
            </Dialog>

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
                    {planilla.enviadoPor && ['enviado', 'aprobado'].includes(planilla.estado) && (
                      <Typography variant="caption" sx={{ color: 'rgba(0,219,180,0.6)' }}>
                        Enviado por: {planilla.enviadoPor}{planilla.enviadoEn ? ` — ${fdate(planilla.enviadoEn)}` : ''}
                      </Typography>
                    )}
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
                    {isBorrador && canPUpdate2 && !editHeader && (
                      <Button onClick={startEditHeader} size="small" variant="text" sx={{ minWidth: 0 }}><EditIcon fontSize="small" /></Button>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {planilla?.tipo === 'CAO' && <EvidenciaStatsButton planillaId={planilla.id} onClick={() => setShowGeneralEvidencia(true)} />}
                    {isBorrador && canPUpdate2 && !isAdmin && (
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
                    <BaseGrid ref={puccRef} planilla={planilla} isAdmin={isAdmin} isOper={canEditPlanilla} onRefresh={() => loadPlanilla(planilla.id)} proyectoId={proyecto.id} rubros={proyecto.rubros}
                      onProjectRefresh={async () => { const r = await fetch(`${API}/proyectos/${proyecto.id}`, { credentials: 'include' }); if (r.ok) setProyecto(await r.json()); }} />
                  ) : <CAOGrid planilla={planilla} isAdmin={isAdmin} isOper={canEditPlanilla} isSupervisor={isSupervisor} onRefresh={() => loadPlanilla(planilla.id)} onOpenEvidencia={(id) => setEvidenciaItemId(id)} />}
                </Box>
              </Card>
            )}
          </Box>
        )}

        {tab === 'boletas' && (
          <Card>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', textAlign: 'center', mb: 2, fontSize: '0.9375rem' }}>
                Boletas de Cumplimiento de Contrato
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thBoleta, textAlign: 'left', width: 120 }}>Nº</th>
                      <th style={{ ...thBoleta, textAlign: 'left' }}>Fecha</th>
                      <th style={{ ...thBoleta, textAlign: 'left' }}>Vigencia</th>
                      <th style={{ ...thBoleta, textAlign: 'left' }}>Vencimiento</th>
                      <th style={{ ...thBoleta, textAlign: 'center', width: 70 }}>Acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletas.map(b => (
                      <tr key={b.id}>
                        {boletaEditando === b.id ? (
                          <>
                            <td style={tdBoleta}><TextField size="small" value={boletaForm.numero} onChange={e => setBoletaForm({ ...boletaForm, numero: e.target.value })} sx={{ width: 110 }} /></td>
                            <td style={tdBoleta}><TextField type="date" size="small" value={boletaForm.fecha} onChange={e => setBoletaForm({ ...boletaForm, fecha: e.target.value })} sx={{ width: 140 }} /></td>
                            <td style={tdBoleta}><TextField type="date" size="small" value={boletaForm.vigencia} onChange={e => setBoletaForm({ ...boletaForm, vigencia: e.target.value })} sx={{ width: 140 }} /></td>
                            <td style={tdBoleta}><TextField type="date" size="small" value={boletaForm.vencimiento} onChange={e => setBoletaForm({ ...boletaForm, vencimiento: e.target.value })} sx={{ width: 140 }} /></td>
                            <td style={{ ...tdBoleta, textAlign: 'center' }}>
                              <Button size="small" variant="contained" onClick={async () => { await updateBoleta(b.id); }} sx={{ mr: 0.5, minWidth: 0, p: 0.5 }}><SaveIcon fontSize="small" /></Button>
                              <Button size="small" variant="text" onClick={() => setBoletaEditando(null)} sx={{ minWidth: 0, p: 0.5 }}>✕</Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={tdBoleta}>{b.numero}</td>
                            <td style={tdBoleta}>{fechaLiteral(b.fecha)}</td>
                            <td style={tdBoleta}>{fechaLiteral(b.vigencia)}</td>
                            <td style={tdBoleta}>{fechaLiteral(b.vencimiento)}</td>
                            <td style={{ ...tdBoleta, textAlign: 'center' }}>
                              <Button size="small" variant="text" onClick={() => startEditBoleta(b)} sx={{ minWidth: 0, p: 0.5, color: 'rgba(150,200,255,0.5)' }}><EditIcon fontSize="small" /></Button>
                              <Button size="small" variant="text" onClick={async () => { if (confirm('Eliminar boleta?')) { await deleteBoleta(b.id); } }} sx={{ minWidth: 0, p: 0.5, color: 'rgba(255,107,107,0.6)' }}><DeleteIcon fontSize="small" /></Button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {boletaCreando && (
                      <tr>
                        <td style={tdBoleta}><TextField size="small" value={boletaForm.numero} onChange={e => setBoletaForm({ ...boletaForm, numero: e.target.value })} sx={{ width: 110 }} /></td>
                        <td style={tdBoleta}><TextField type="date" size="small" value={boletaForm.fecha} onChange={e => setBoletaForm({ ...boletaForm, fecha: e.target.value })} sx={{ width: 140 }} /></td>
                        <td style={tdBoleta}><TextField type="date" size="small" value={boletaForm.vigencia} onChange={e => setBoletaForm({ ...boletaForm, vigencia: e.target.value })} sx={{ width: 140 }} /></td>
                        <td style={tdBoleta}><TextField type="date" size="small" value={boletaForm.vencimiento} onChange={e => setBoletaForm({ ...boletaForm, vencimiento: e.target.value })} sx={{ width: 140 }} /></td>
                        <td style={{ ...tdBoleta, textAlign: 'center' }}>
                          <Button size="small" variant="contained" onClick={createBoleta} sx={{ mr: 0.5, minWidth: 0, p: 0.5 }}><SaveIcon fontSize="small" /></Button>
                          <Button size="small" variant="text" onClick={() => setBoletaCreando(false)} sx={{ minWidth: 0, p: 0.5 }}>✕</Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
              {!boletaCreando && (
                <Button variant="outlined" size="small" onClick={initNewBoleta} sx={{ mt: 1.5 }} startIcon={<AddIcon />}>Agregar boleta</Button>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'dashboard' && dashboardContent}

        {/* Evidence modals */}
        {evidenciaItemId != null && planilla && (
          <PanelEvidencias planilla={planilla} avanceItemId={evidenciaItemId} onClose={() => setEvidenciaItemId(null)} onRefresh={() => loadPlanilla(planilla.id)}
            proyectoLat={proyecto?.latitud} proyectoLng={proyecto?.longitud} />
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
                <TextField label="Monto Contrato Bs" type="text" value={editMontoDisplay !== '' ? editMontoDisplay : (editForm.montoContrato ? fmt(editForm.montoContrato) : '')}
                  onChange={e => { const raw = e.target.value.replace(/[^0-9,]/g, ''); setEditMontoDisplay(raw); const num = parseFloat(raw.replace(',', '.')); if (!isNaN(num)) setEditForm({ ...editForm, montoContrato: num }); else if (raw === '') setEditForm({ ...editForm, montoContrato: 0 }); }}
                  onFocus={() => setEditMontoDisplay(editForm.montoContrato ? String(editForm.montoContrato).replace('.', ',') : '')}
                  onBlur={() => setEditMontoDisplay('')} size="small" />
                <TextField label="% Anticipo" type="number" value={editForm.anticipoPct} onChange={e => setEditForm({ ...editForm, anticipoPct: +e.target.value })} size="small" />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Orden de Proceder" type="date" value={editForm.ordenProceder} onChange={e => setEditForm({ ...editForm, ordenProceder: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Fecha Conclusión" type="date" value={editForm.fechaConclusion} onChange={e => setEditForm({ ...editForm, fechaConclusion: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Días Suspendidos" type="number" value={editForm.suspendidoDias || ''} onChange={e => setEditForm({ ...editForm, suspendidoDias: +e.target.value })} size="small" />
                <TextField select label="Jefatura" value={editForm.jefatura} onChange={e => setEditForm({ ...editForm, jefatura: e.target.value })} size="small">
                  {['DI','UDETRA','UEH','UPRADE','UNASVI'].map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField select label="Situación" value={editForm.situacion} onChange={e => setEditForm({ ...editForm, situacion: e.target.value })} size="small">
                  <MenuItem value="">Sin especificar</MenuItem>
                  {Object.entries(ETAPA_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
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
  const [catItemSearch, setCatItemSearch] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [nuevoItemUnidad, setNuevoItemUnidad] = useState('');
  const [nuevoItemRubro, setNuevoItemRubro] = useState<{ id?: number; nombre: string } | null>(null);

  const isBorrador = planilla.estado === 'borrador';
  const isEnviado = planilla.estado === 'enviado';
  const canEdit = isBorrador && isOper;
  const actionCol = (isAdmin && isEnviado) || canEdit ? 1 : 0;

  async function loadCatalogo() {
    setCatLoading(true);
    try {
      const res = await fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' });
      if (!res.ok) return;
      const rubros = await res.json();
      setCatRubros(rubros);
      const allItems: Record<number, any[]> = {};
      await Promise.all(rubros.map(async (r: any) => {
        const ir = await fetch(`${API}/catalogo/rubros/${r.id}/items`, { credentials: 'include' });
        if (ir.ok) allItems[r.id] = await ir.json();
      }));
      setCatItems(allItems);
    } finally { setCatLoading(false); }
  }
  async function loadCatItems(id: number) { if (catItems[id]) return; const r = await fetch(`${API}/catalogo/rubros/${id}/items`, { credentials: 'include' }); if (r.ok) { const data = await r.json(); setCatItems(p => ({ ...p, [id]: data })); } }
  function toggleSel(rubroId: number, itemId: number) { setCatSel(p => { const s = new Set(p[rubroId] || []); s.has(itemId) ? s.delete(itemId) : s.add(itemId); return { ...p, [rubroId]: s }; }); }
  function toggleAll(rubroId: number, items: any[]) { setCatSel(p => { const s = new Set(p[rubroId] || []); items.forEach(i => s.has(i.id) ? s.delete(i.id) : s.add(i.id)); return { ...p, [rubroId]: s }; }); }
  async function importar() {
    const rubros = Object.entries(catSel).filter(([_, s]) => s.size > 0).map(([id, s]) => ({ rubroCatalogoId: +id, itemCatalogoIds: [...s] }));
    if (!rubros.length) return;
    await apiFetch('POST', `${API}/proyectos/${proyectoId}/importar-items`, { rubros });
    setShowCat(false); setCatSel({}); await onProjectRefresh(); await onRefresh();
  }
  async function crearItemDelCatalogo() {
    if (!catItemSearch.trim() || !nuevoItemRubro) return;
    let rubroId: number;
    if (nuevoItemRubro.id) {
      rubroId = nuevoItemRubro.id;
    } else {
      const nr = await apiFetch('POST', `${API}/catalogo/rubros`, { jefatura, nombre: nuevoItemRubro.nombre });
      if (!nr) return;
      rubroId = nr.id;
      setCatRubros(p => [...p, { id: rubroId!, nombre: nuevoItemRubro!.nombre, jefatura, _count: { items: 0 } }]);
    }
    const maxNum = catItems[rubroId]?.length ?? 0;
    const ni = await apiFetch('POST', `${API}/catalogo/rubros/${rubroId}/items`, { numero: maxNum + 1, descripcion: catItemSearch.trim(), unidad: nuevoItemUnidad || '' });
    if (!ni) return;
    const rr = await fetch(`${API}/catalogo/rubros/${rubroId}/items`, { credentials: 'include' });
    if (rr.ok) {
      const items = await rr.json();
      setCatItems(p => ({ ...p, [rubroId]: items }));
    }
    setCatSel(p => ({ ...p, [rubroId]: new Set([...(p[rubroId] || []), ni.id]) }));
    setCatItemSearch(''); setNuevoItemUnidad(''); setNuevoItemRubro(null);
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

  const totalMO = useMemo(() =>
    planilla.avances.reduce((s, a) => {
      const pu = editPU[a.id] !== undefined ? editPU[a.id] : a.precioUnitario ?? a.item?.precioUnitario ?? 0;
      const cc = editCC[a.id] !== undefined ? editCC[a.id] : a.cantidadContrato ?? a.item?.cantidadContrato ?? 1;
      return s + pu * cc;
    }, 0),
  [planilla.avances, editPU, editCC]);
  const canManage = canEdit && (isAdmin || isOper);
  const t = { bg: 'rgba(91,154,255,0.08)', color: 'rgba(150,200,255,0.7)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <>
      {planilla.estado === 'aprobado' && (
        <Box sx={{ m: 2, p: 1.5, borderRadius: 2, background: 'rgba(91,154,255,0.12)', border: '1px solid rgba(91,154,255,0.2)', color: 'rgba(150,200,255,0.9)', fontSize: '0.8125rem' }}>
          Planilla Base aprobada — datos inmutables.
        </Box>
      )}

      {canEdit && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, px: 2 }}>
          <Button onClick={() => { loadCatalogo(); setShowCat(true); }} size="small" variant="outlined" startIcon={<span>📋</span>}>Importar del catálogo</Button>
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
                          ? <input type="text" inputMode="decimal" placeholder="0" value={pu || ''} onChange={e => setEditPU(m => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm text-right" style={{ display: 'inline', width: 80, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.2)', borderRadius: 4, padding: '4px 6px' }} />
                          : fmt(pu)}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {canEdit && av.aprobado !== true && !isLocked
                          ? <input type="text" inputMode="decimal" placeholder="0" value={cc || ''} onChange={e => setEditCC(m => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm text-right" style={{ display: 'inline', width: 80, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.2)', borderRadius: 4, padding: '4px 6px' }} />
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
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField placeholder="Buscar rubro..." value={catSearch} onChange={e => setCatSearch(e.target.value)} size="small" sx={{ flex: 1 }} disabled={!!catItemSearch} />
              <TextField placeholder="Buscar item por descripción..." value={catItemSearch} onChange={e => setCatItemSearch(e.target.value)} size="small" sx={{ flex: 1 }} />
            </Box>

            {/* Resultados aplanados de búsqueda de items */}
            {catItemSearch.length >= 3 ? (
              (() => {
                const q = catItemSearch.toLowerCase();
                const flat: { rubroId: number; rubroNombre: string; ci: any }[] = [];
                for (const r of catRubros) {
                  for (const ci of catItems[r.id] || []) {
                    if (ci.descripcion.toLowerCase().includes(q)) {
                      flat.push({ rubroId: r.id, rubroNombre: r.nombre, ci });
                    }
                  }
                }
                if (flat.length > 0) {
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {flat.map(({ rubroId, rubroNombre, ci }) => (
                        <Box key={ci.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 0.5, px: 1, '&:hover': { background: 'rgba(100,180,255,0.05)' } }} onClick={() => toggleSel(rubroId, ci.id)}>
                          <input type="checkbox" checked={catSel[rubroId]?.has(ci.id) || false} onChange={() => {}} style={{ accentColor: '#5b9aff' }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>{ci.descripcion}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>{rubroNombre}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)' }}>{ci.unidad}</Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                }
                return (
                  <Box sx={{ border: '1px dashed rgba(255,180,0,0.3)', borderRadius: 1, p: 2, mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,180,0,0.8)' }}>No se encontró "{catItemSearch}" — crear nuevo item</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField label="Descripción" value={catItemSearch} onChange={e => setCatItemSearch(e.target.value)} size="small" fullWidth />
                      <TextField label="Unidad" value={nuevoItemUnidad} onChange={e => setNuevoItemUnidad(e.target.value)} size="small" placeholder="m, m³, kg, glb..." sx={{ width: 140 }} />
                      <Autocomplete
                        freeSolo
                        options={catRubros.map(r => r.nombre)}
                        value={nuevoItemRubro?.nombre || ''}
                        onChange={(_, v) => {
                          const existing = catRubros.find(r => r.nombre === v);
                          setNuevoItemRubro(existing ? { id: existing.id, nombre: existing.nombre } : (v ? { nombre: v } : null));
                        }}
                        renderInput={(params) => <TextField {...params} label="Rubro" size="small" placeholder="Seleccionar o escribir nuevo..." />}
                      />
                      <Button onClick={crearItemDelCatalogo} variant="contained" size="small" disabled={!catItemSearch.trim() || !nuevoItemRubro}>Crear y agregar</Button>
                    </Box>
                  </Box>
                );
              })()
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {catRubros.filter(r => !catSearch || r.nombre.toLowerCase().includes(catSearch.toLowerCase())).map(r => (
                  <Card key={r.id} variant="outlined">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { background: 'rgba(100,180,255,0.05)' } }}
                      onClick={() => { setCatExpanded(p => ({ ...p, [r.id]: !p[r.id] })); }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.nombre}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)' }}>{catItems[r.id]?.length ?? r._count?.items ?? 0} items {catExpanded[r.id] ? '▴' : '▾'}</Typography>
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
                {catRubros.length === 0 && <Typography sx={{ textAlign: 'center', py: 4, color: 'rgba(150,200,255,0.4)' }}>{catLoading ? 'Cargando…' : 'Sin rubros'}</Typography>}
              </Box>
            )}
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
  const isBorrador = planilla.estado === 'borrador';
  const isEnviado = planilla.estado === 'enviado';
  const actionCol = (isAdmin && isEnviado) || (isBorrador && isOper) ? 1 : 0;
  const totalCols = 16 + actionCol;

  function cd(av: Avance) { return { pu: av.precioUnitario ?? av.item?.precioUnitario ?? 0, cc: av.cantidadContrato ?? av.item?.cantidadContrato ?? 1, mo: (av.precioUnitario ?? av.item?.precioUnitario ?? 0) * (av.cantidadContrato ?? av.item?.cantidadContrato ?? 1) }; }
  function hist(av: Avance) { if (!av.itemId || !planilla.historico) return { cantidad: 0, monto: 0 }; return planilla.historico[av.itemId] || { cantidad: 0, monto: 0 }; }
  function getCant(av: Avance) { return editCant[av.id] !== undefined ? editCant[av.id] : av.cantidad; }

  async function saveCant(av: Avance) {
    const c = editCant[av.id]; if (c === undefined) return;
    const maxCant = Math.max(0, cd(av).cc - hist(av).cantidad);
    if (c > maxCant) { alert(`La cantidad supera el saldo disponible (${fmt(maxCant)}). Avance acumulado no puede exceder 100%.`); return; }
    await fetch(`${API}/planillas/${planilla.id}/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ avanceId: av.id, itemId: av.itemId, cantidad: c }] }), credentials: 'include' });
    setEditCant((m) => { const n = { ...m }; delete n[av.id]; return n }); setSavedCant(prev => new Set([...prev, av.id])); onRefresh();
  }
  function unlockCant(av: Avance) { const n = new Set(savedCant); n.delete(av.id); setSavedCant(n); setEditCant(m => ({ ...m, [av.id]: av.cantidad })); }
  async function removeItem(av: Avance) { if (!confirm('Eliminar este item de la planilla?')) return; await fetch(`${API}/planillas/${planilla.id}/items/${av.id}`, { method: 'DELETE', credentials: 'include' }); onRefresh(); }
  async function handleApprove(av: Avance) { await fetch(`${API}/planillas/${planilla.id}/aprobar-item/${av.id}`, { method: 'PATCH', credentials: 'include' }); onRefresh(); }
  async function handleReject(av: Avance) { await fetch(`${API}/planillas/${planilla.id}/rechazar-item/${av.id}`, { method: 'PATCH', credentials: 'include' }); onRefresh(); }

  const hasRejected = planilla.avances.some((a) => a.aprobado === false);
  const hasRecentApproval = planilla.estado === 'aprobado';
  const groups = useMemo(() => groupAvances(planilla.avances), [planilla.avances]);
  const grandContrato = useMemo(() =>
    planilla.avances.reduce((s, a) => {
      const pu = a.precioUnitario ?? a.item?.precioUnitario ?? 0;
      const cc = a.cantidadContrato ?? a.item?.cantidadContrato ?? 1;
      return s + cc * pu;
    }, 0),
  [planilla.avances]);
  const grandAnterior = useMemo(() =>
    planilla.avances.reduce((s, a) => {
      if (!a.itemId || !planilla.historico) return s;
      const h = planilla.historico[a.itemId] || { cantidad: 0, monto: 0 };
      return s + h.monto;
    }, 0),
  [planilla.avances, planilla.historico]);
  const grandPresente = useMemo(() =>
    planilla.avances.reduce((s, a) => {
      const pu = a.precioUnitario ?? a.item?.precioUnitario ?? 0;
      const cant = editCant[a.id] !== undefined ? editCant[a.id] : a.cantidad;
      return s + cant * pu;
    }, 0),
  [planilla.avances, editCant]);
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
            <th style={th} colSpan={2}>% Avance Fís. Item</th>
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
            <th style={{ ...th, textAlign: 'right' }}>Del Periodo</th>
            <th style={{ ...th, textAlign: 'right' }}>A la Fecha</th>
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
                        {isBorrador && isOper && av.itemId && av.aprobado !== true && !isLockedCAO && h.cantidad < c.cc ? (
                          <input type="text" inputMode="decimal" placeholder="0" min={0} max={Math.max(0, c.cc - h.cantidad)} value={cant || ''} onChange={e => setEditCant(m => ({ ...m, [av.id]: +e.target.value }))} className="input input-sm text-right" style={{ display: 'inline', width: 100, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.2)', borderRadius: 4, padding: '4px 6px' }} />
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
                      {isBorrador && isOper && av.aprobado !== true && (
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

        </tbody>
      </table>
    </>
  )}
