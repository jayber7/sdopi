'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { can } from '@/lib/permissions';
import LlenadoAsistido from './LlenadoAsistido';
import { mergeParsed } from '@/lib/proyecto-parser';
import { provincias, municipios } from '@/lib/municipios';
import { reverseNominatim } from '@/lib/osm-services';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

const API = '/api';

interface Item { id: number; numero: number; descripcion: string; unidad: string; montoOriginal: number; }
interface Rubro { id: number; codigo: string; nombre: string; items: Item[]; }
interface Proyecto {
  id: number; nombre: string; contratoNro: string; montoContrato: number;
  contratista: string; supervisor: string; fiscal: string; direccion: string;
  latitud: number | null; longitud: number | null; ordenProceder: string;
  fechaConclusion: string; suspendidoDias: number; anticipoPct: number;
  jefatura: string; provincia: string | null; municipio: string | null; rubros: Rubro[];
  situacion: string | null;
}

const INIT_FORM = {
  nombre: '', contratoNro: '', montoContrato: 0, anticipoPct: 13.7747448,
  ordenProceder: '', fechaConclusion: '', suspendidoDias: 0,
  direccion: '', latitud: '', longitud: '',
  provincia: '', municipio: '',
  contratista: '', supervisor: '', fiscal: '', jefatura: 'DI',
};

const ETAPA_LABEL: Record<string, string> = {
  SIN_EJECUCION: 'Sin Ejecución', PREINVERSION: 'Preinversión', INVERSION: 'Inversión',
  CAMBIO_PREINVERSION_A_INVERSION: 'Cambio a Inversión', INVERSION_PARA_LICITACION: 'Inversión para Licitación',
  EDTP_CONCLUIDO: 'EDTP Concluido', EDTP_CONCLUIDO_ESPERA_INVERSION: 'EDTP Concluido (espera inversión)',
  EN_EJECUCION: 'En Ejecución', EN_CIERRE: 'En Cierre', CONCLUIDO: 'Concluido',
  CON_ENTREGA_DEFINITIVA: 'Con Entrega Definitiva', CONCILIACION_SALDOS: 'Conciliación de Saldos',
  AUDITORIA_EXTERNA: 'Auditoría Externa', SUSPENSION_CONTRATACION: 'Suspensión de Contratación',
};

const ETAPA_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  SIN_EJECUCION: 'default', PREINVERSION: 'info', INVERSION: 'primary',
  CAMBIO_PREINVERSION_A_INVERSION: 'warning', INVERSION_PARA_LICITACION: 'secondary',
  EDTP_CONCLUIDO: 'success', EDTP_CONCLUIDO_ESPERA_INVERSION: 'warning',
  EN_EJECUCION: 'primary', EN_CIERRE: 'warning', CONCLUIDO: 'success',
  CON_ENTREGA_DEFINITIVA: 'success', CONCILIACION_SALDOS: 'default',
  AUDITORIA_EXTERNA: 'info', SUSPENSION_CONTRATACION: 'error',
};

export default function ProyectosPage() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'list'>('card');
  const [modal, setModal] = useState<{ open: boolean; edit?: Proyecto }>({ open: false });
  const [form, setForm] = useState({ ...INIT_FORM });
  const [search, setSearch] = useState('');
  const [etapaFilter, setEtapaFilter] = useState('');
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const canCreate = can(user, 'proyectos', 'create');
  const canEdit = can(user, 'proyectos', 'update');
  const canDelete = can(user, 'proyectos', 'delete');
  const isOper = canCreate || canEdit;
  const isAdmin = canDelete;

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(`${API}/proyectos`, { credentials: 'include', signal: ac.signal })
      .then(r => r.ok ? r.json() : [])
      .then(setProyectos)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  async function loadProyectos() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/proyectos`, { credentials: 'include' });
      setProyectos(r.ok ? await r.json() : []);
    } finally { setLoading(false); }
  }

  const filtered = proyectos.filter(p => {
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (etapaFilter && p.situacion !== etapaFilter) return false;
    return true;
  });

  function openCreate() { setForm({ ...INIT_FORM }); setModal({ open: true }); }

  function openEdit(p: Proyecto) {
    const tieneCoords = p.latitud !== null && p.longitud !== null;
    setForm({
      nombre: p.nombre, contratoNro: p.contratoNro, montoContrato: p.montoContrato,
      anticipoPct: p.anticipoPct, ordenProceder: p.ordenProceder?.slice(0,10) || '',
      fechaConclusion: p.fechaConclusion?.slice(0,10) || '', suspendidoDias: p.suspendidoDias,
      direccion: p.direccion, latitud: tieneCoords ? String(p.latitud) : '',
      longitud: tieneCoords ? String(p.longitud) : '',
      provincia: p.provincia || '', municipio: p.municipio || '',
      contratista: p.contratista, supervisor: p.supervisor, fiscal: p.fiscal, jefatura: p.jefatura,
    });
    setModal({ open: true, edit: p });
  }

  async function save() {
    const f = formRef.current;
    const required: (keyof typeof f)[] = ['nombre', 'contratoNro', 'montoContrato', 'ordenProceder', 'fechaConclusion', 'direccion', 'contratista', 'supervisor', 'fiscal'];
    for (const k of required) { if (!f[k] && f[k] !== 0) { alert(`Campo requerido: ${k}`); return; } }
    if (!f.latitud || !f.longitud) { alert('Debe seleccionar una ubicación en el mapa'); return; }
    const body: any = { ...f, montoContrato: Number(f.montoContrato), anticipoPct: Number(f.anticipoPct), suspendidoDias: Number(f.suspendidoDias), latitud: Number(f.latitud), longitud: Number(f.longitud) };
    const url = modal.edit ? `${API}/proyectos/${modal.edit.id}` : `${API}/proyectos`;
    const method = modal.edit ? 'PATCH' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress size={32} sx={{ color: 'rgba(100,180,255,0.5)' }} />
    </Box>
  );

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>
          Proyectos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
            <ToggleButton value="card"><ViewModuleIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          {isOper && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Nuevo Proyecto
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'stretch' }}>
        <TextField placeholder="Buscar por nombre…" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ flex: 1, maxWidth: 360 }} />
        <TextField select label="Etapa" value={etapaFilter} onChange={e => setEtapaFilter(e.target.value)} size="small" sx={{ minWidth: 220 }}>
          <MenuItem value="">Todas las etapas</MenuItem>
          {Object.keys(ETAPA_LABEL).map(k => <MenuItem key={k} value={k}>{ETAPA_LABEL[k]}</MenuItem>)}
        </TextField>
      </Box>

      {view === 'card' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((p) => (
            <Card key={p.id} sx={{ '&:hover': { boxShadow: '0 6px 30px rgba(0,0,0,0.35)' } }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/proyectos/${p.id}`} style={{ textDecoration: 'none' }}>
                      <Typography variant="h6" sx={{ color: 'rgba(150,220,255,0.9)', fontSize: '1rem', '&:hover': { textDecoration: 'underline' } }}>
                        {p.nombre}
                      </Typography>
                    </Link>
                    <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)', mt: 0.3, display: 'block' }}>
                      Contrato: {p.contratoNro}
                    </Typography>
                    {p.situacion && (
                      <Chip label={ETAPA_LABEL[p.situacion] || p.situacion} size="small" color={ETAPA_COLOR[p.situacion]} sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(0,219,180,0.8)' }}>
                      Bs {p.montoContrato.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>{p.contratista}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                  <Button component={Link} href={`/proyectos/${p.id}`} size="small" startIcon={<VisibilityIcon />} variant="text" sx={{ fontSize: '0.75rem', color: 'rgba(150,200,255,0.6)' }}>
                    Ver
                  </Button>
                  {isOper && (
                    <Button onClick={() => openEdit(p)} size="small" startIcon={<EditIcon />} variant="text" sx={{ fontSize: '0.75rem', color: 'rgba(150,200,255,0.6)' }}>
                      Editar
                    </Button>
                  )}
                  {isAdmin && (
                    <Button onClick={() => desactivar(p)} size="small" startIcon={<DeleteIcon />} variant="text" sx={{ fontSize: '0.75rem', color: 'rgba(255,107,107,0.7)' }}>
                      Desactivar
                    </Button>
                  )}
                </Box>
                {p.rubros.length > 0 && (
                  <Box component="details" sx={{ mt: 1.5 }}>
                    <Box component="summary" sx={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(150,200,255,0.5)' }}>
                      Rubros ({p.rubros.length})
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {p.rubros.map((r) => (
                        <Box key={r.id} sx={{ p: 1, borderRadius: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem' }}>{r.codigo} — {r.nombre}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)' }}>{r.items.length} items</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Box} sx={{ border: '1px solid rgba(100,180,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { background: 'rgba(10,14,39,0.6)', color: 'rgba(150,200,255,0.6)', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid rgba(100,180,255,0.1)' } }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Contrato</TableCell>
                <TableCell>Etapa</TableCell>
                <TableCell align="right">Monto Bs</TableCell>
                <TableCell>Contratista</TableCell>
                <TableCell sx={{ width: 160 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} sx={{ '& td': { borderBottom: '1px solid rgba(100,180,255,0.06)', color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem' }, '&:hover': { background: 'rgba(100,180,255,0.03)' } }}>
                  <TableCell>
                    <Link href={`/proyectos/${p.id}`} style={{ color: 'rgba(150,220,255,0.9)', textDecoration: 'none' }}>
                      {p.nombre}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(150,200,255,0.4)' }}>{p.contratoNro}</TableCell>
                  <TableCell>
                    {p.situacion && <Chip label={ETAPA_LABEL[p.situacion] || p.situacion} size="small" color={ETAPA_COLOR[p.situacion]} sx={{ height: 20, fontSize: '0.65rem' }} />}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'rgba(0,219,180,0.8)' }}>
                    {p.montoContrato.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(150,200,255,0.5)' }}>{p.contratista}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button component={Link} href={`/proyectos/${p.id}`} size="small" startIcon={<VisibilityIcon />} variant="text" sx={{ fontSize: '0.7rem', color: 'rgba(150,200,255,0.6)', minWidth: 0 }}>
                        Ver
                      </Button>
                      {isOper && (
                        <Button onClick={() => openEdit(p)} size="small" startIcon={<EditIcon />} variant="text" sx={{ fontSize: '0.7rem', color: 'rgba(150,200,255,0.6)', minWidth: 0 }}>
                          Editar
                        </Button>
                      )}
                      {isAdmin && (
                        <Button onClick={() => desactivar(p)} size="small" startIcon={<DeleteIcon />} variant="text" sx={{ fontSize: '0.7rem', color: 'rgba(255,107,107,0.7)', minWidth: 0 }}>
                          Desactivar
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && filtered.length === 0 && (
        <Typography sx={{ color: 'rgba(150,200,255,0.4)', textAlign: 'center', py: 8 }}>
          No hay proyectos registrados.
        </Typography>
      )}

      <Dialog open={modal.open} onClose={() => {}} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.125rem' }}>
          {modal.edit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          <IconButton onClick={() => setModal({ open: false })} size="small" sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(150,200,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Nombre del proyecto" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} size="small" fullWidth />
          <TextField label="N° Contrato" value={form.contratoNro} onChange={e => setForm({ ...form, contratoNro: e.target.value })} size="small" fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Monto Contrato Bs" type="number" value={form.montoContrato || ''} onChange={e => setForm({ ...form, montoContrato: +e.target.value })} size="small" />
            <TextField label="% Anticipo" type="number" value={form.anticipoPct} onChange={e => setForm({ ...form, anticipoPct: +e.target.value })} size="small" />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Orden de Proceder" type="date" value={form.ordenProceder} onChange={e => setForm({ ...form, ordenProceder: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Fecha Conclusión" type="date" value={form.fechaConclusion} onChange={e => setForm({ ...form, fechaConclusion: e.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Días Suspendidos" type="number" value={form.suspendidoDias} onChange={e => setForm({ ...form, suspendidoDias: +e.target.value })} size="small" />
            <TextField select label="Jefatura" value={form.jefatura} onChange={e => setForm({ ...form, jefatura: e.target.value })} size="small">
              {['DI','UDETRA','UEH','UPRADE','UNASVI'].map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField select label="Provincia" value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value, municipio: '', latitud: '', longitud: '', direccion: '' })} size="small">
              <MenuItem value="">Seleccionar provincia</MenuItem>
              {provincias.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField select label="Municipio" value={form.municipio} onChange={e => {
              const m = municipios.find(m => m.nombre === e.target.value);
              setForm(prev => ({ ...prev, municipio: e.target.value, latitud: m ? String(m.coords[0]) : prev.latitud, longitud: m ? String(m.coords[1]) : prev.longitud }));
              if (m) reverseNominatim(m.coords[0], m.coords[1]).then(dir => { if (dir) setForm(prev => ({ ...prev, direccion: dir })); });
            }} size="small">
              <MenuItem value="">Seleccionar municipio</MenuItem>
              {municipios.filter(m => !form.provincia || m.provincia === form.provincia).map(m => <MenuItem key={m.id} value={m.nombre}>{m.nombre}</MenuItem>)}
            </TextField>
          </Box>
          <MapPicker lat={form.latitud ? parseFloat(form.latitud) : undefined} lng={form.longitud ? parseFloat(form.longitud) : undefined}
            onChange={(lat, lng) => setForm(prev => ({ ...prev, latitud: String(lat), longitud: String(lng) }))}
            onReverseGeocode={(dir) => setForm(prev => ({ ...prev, direccion: dir }))} />
          <TextField label="Contratista" value={form.contratista} onChange={e => setForm({ ...form, contratista: e.target.value })} size="small" fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Supervisor" value={form.supervisor} onChange={e => setForm({ ...form, supervisor: e.target.value })} size="small" />
            <TextField label="Fiscal" value={form.fiscal} onChange={e => setForm({ ...form, fiscal: e.target.value })} size="small" />
          </Box>
          <LlenadoAsistido currentForm={form} onApply={(p) => setForm(mergeParsed(p, form) as any)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModal({ open: false })} variant="outlined">Cancelar</Button>
          <Button onClick={save} variant="contained">{modal.edit ? 'Guardar Cambios' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
