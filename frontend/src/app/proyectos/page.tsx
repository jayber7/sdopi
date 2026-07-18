'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
}

const INIT_FORM = {
  nombre: '', contratoNro: '', montoContrato: 0, anticipoPct: 13.7747448,
  ordenProceder: '', fechaConclusion: '', suspendidoDias: 0,
  direccion: '', latitud: '', longitud: '',
  provincia: '', municipio: '',
  contratista: '', supervisor: '', fiscal: '', jefatura: 'DI',
};

export default function ProyectosPage() {
  const { user } = useAuth();
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
        {isOper && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo Proyecto
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {proyectos.map((p) => (
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
        {!loading && proyectos.length === 0 && (
          <Typography sx={{ color: 'rgba(150,200,255,0.4)', textAlign: 'center', py: 8 }}>
            No hay proyectos registrados.
          </Typography>
        )}
      </Box>

      <Dialog open={modal.open} onClose={() => setModal({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.125rem' }}>
          {modal.edit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
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
              {['DI','JE','JT','JUPRE','JUS'].map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
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
