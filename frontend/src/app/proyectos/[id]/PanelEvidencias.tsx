'use client';

import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import BlockIcon from '@mui/icons-material/Block';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const API = '/api';

interface Evidencia {
  id: number; url: string; publicId: string;
  exifLatitud: number | null; exifLongitud: number | null;
  exifAltitud: number | null; exifFechaCaptura: string | null;
  exifDispositivo: string | null; exifModeloCamara: string | null; exifTieneGPS: boolean;
  verificacionEstado: string; verificacionDistancia: number | null;
  verificacionRadio: number; verificacionFuente: string | null;
  verificacionObservaciones: string | null; categoria: string;
  descripcion: string | null; avanceItemId: number; planillaId: number;
  userId: number; createdAt: string;
  user?: { id: number; nombre: string }; avanceItem?: any;
}

interface EvidenciaStats {
  total: number; verificadas: number; sospechosas: number;
  rechazadas: number; pendientes: number;
  itemsSinEvidencia: number; itemsTotal: number;
  porItem: Record<number, { count: number; mejorEstado: string | null }>;
}

export function EvidenciaStatsButton({ planillaId, onClick }: { planillaId: number; onClick: () => void }) {
  const [stats, setStats] = useState<EvidenciaStats | null>(null);

  useEffect(() => {
    fetch(`${API}/planillas/${planillaId}/fotos/stats`, { credentials: 'include' })
      .then(r => r.ok && r.json()).then(setStats).catch(() => {});
  }, [planillaId]);

  if (!stats || stats.itemsTotal === 0) return null;

  const allOk = stats.verificadas >= stats.itemsTotal && stats.rechazadas === 0;
  const hasRejected = stats.rechazadas > 0;
  const hasSuspicious = stats.sospechosas > 0;
  const chipColor = allOk ? 'success' : hasRejected ? 'error' : hasSuspicious ? 'warning' : 'default';

  return (
    <Button size="small" variant="outlined" onClick={onClick} startIcon={<PhotoCameraIcon />} sx={{ fontSize: '0.75rem', color: 'rgba(150,200,255,0.6)' }}>
      Evidencias: <Chip label={`${stats.verificadas}/${stats.itemsTotal}`} color={chipColor as any} size="small" variant="filled" sx={{ ml: 0.5, height: 20, fontSize: '0.625rem' }} /> verificadas
    </Button>
  );
}

export function PanelGeneralEvidencias({ planilla, onClose, onOpenItem }: {
  planilla: any; onClose: () => void; onOpenItem: (avanceItemId: number) => void;
}) {
  const [stats, setStats] = useState<EvidenciaStats | null>(null);
  useEffect(() => {
    fetch(`${API}/planillas/${planilla.id}/fotos/stats`, { credentials: 'include' })
      .then(r => r.ok && r.json()).then(setStats);
  }, [planilla.id]);

  const groups = groupAvances(planilla.avances);

  return createPortal((
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem' }}>
        Panel General de Evidencias
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {stats && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, fontSize: '0.8125rem', color: 'rgba(150,200,255,0.5)' }}>
            <Typography variant="caption">Total: <strong>{stats.total}</strong></Typography>
            <Typography variant="caption" sx={{ color: 'rgba(0,219,180,0.8)' }}>Verificadas: <strong>{stats.verificadas}</strong></Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,180,0,0.8)' }}>Sospechosas: <strong>{stats.sospechosas}</strong></Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,107,107,0.8)' }}>Rechazadas: <strong>{stats.rechazadas}</strong></Typography>
            {stats.itemsSinEvidencia > 0 && <Typography variant="caption" sx={{ color: 'rgba(255,180,0,0.8)' }}>Sin evidencia: <strong>{stats.itemsSinEvidencia}</strong></Typography>}
          </Box>
        )}
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th style={th}>N°</th>
                <th style={{ ...th, minWidth: 200 }}>Descripción</th>
                <th style={{ ...th, textAlign: 'center' }}>Fotos</th>
                <th style={{ ...th, textAlign: 'center' }}>Estado</th>
                <th style={{ ...th, textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g: any) => (
                <Fragment key={g.rubroId ?? g.codigo}>
                  <tr>
                    <td colSpan={5} style={{ ...td, background: 'rgba(91,154,255,0.08)', fontWeight: 600, color: 'rgba(150,200,255,0.7)', fontSize: '0.6875rem', padding: '4px 12px' }}>
                      {g.codigo} — {g.nombre}
                    </td>
                  </tr>
                  {g.avances.map((av: any) => {
                    const ev = stats?.porItem[av.id];
                    const estado = ev?.mejorEstado || null;
                    const chipColor = estado === 'VERIFICADO' ? 'success' : estado === 'SOSPECHOSO' ? 'warning' : estado === 'RECHAZADO' ? 'error' : 'default';
                    return (
                      <tr key={av.id}>
                        <td style={td}>{av.item?.numero ?? 'N'}</td>
                        <td style={td}>{av.descripcion ?? av.item?.descripcion ?? ''}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{ev?.count || 0}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          {estado ? <Chip label={estado} color={chipColor as any} size="small" variant="filled" /> : <Chip label="—" size="small" variant="outlined" />}
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <Button size="small" variant="outlined" sx={{ fontSize: '0.625rem' }} onClick={() => { onClose(); onOpenItem(av.id); }}>Ver</Button>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Box>
      </DialogContent>
    </Dialog>
  ), document.body);
}

const th = { background: 'rgba(255,255,255,0.03)', color: 'rgba(150,200,255,0.7)', fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', whiteSpace: 'nowrap' as const };
const td = { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle' as const };

function groupAvances(avs: any[]) {
  const map = new Map<string, { codigo: string; nombre: string; rubroId: number | null; avances: any[] }>();
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

export function PanelEvidencias({ planilla, avanceItemId, onClose, onRefresh }: {
  planilla: any; avanceItemId: number | null; onClose: () => void; onRefresh: () => void;
}) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFoto, setExpandedFoto] = useState<number | null>(null);
  const [uploadCategoria, setUploadCategoria] = useState('VISTA_GENERAL');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  const avance = avanceItemId ? planilla?.avances?.find((a: any) => a.id === avanceItemId) : null;

  useEffect(() => {
    if (!planilla || !avanceItemId) return;
    setLoading(true);
    fetch(`${API}/planillas/${planilla.id}/fotos`, { credentials: 'include' })
      .then(r => r.ok && r.json())
      .then(data => setEvidencias(data.filter((e: Evidencia) => e.avanceItemId === avanceItemId)))
      .finally(() => setLoading(false));
  }, [planilla?.id, avanceItemId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !planilla || !avanceItemId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('foto', file); formData.append('categoria', uploadCategoria);
    if (uploadDesc) formData.append('descripcion', uploadDesc);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      formData.append('browserGpsLat', String(pos.coords.latitude));
      formData.append('browserGpsLng', String(pos.coords.longitude));
    } catch {}
    const r = await fetch(`${API}/planillas/${planilla.id}/fotos/${avanceItemId}`, { method: 'POST', credentials: 'include', body: formData });
    setUploading(false);
    if (r.ok) { const foto = await r.json(); setEvidencias(prev => [foto, ...prev]); onRefresh(); setUploadDesc(''); setUploadCategoria('VISTA_GENERAL'); }
    else { const err = await r.json().catch(() => ({ message: 'Error al subir foto' })); alert(err.message || 'Error al subir foto'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminar esta evidencia?')) return;
    const r = await fetch(`${API}/evidencias/${id}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) { setEvidencias(prev => prev.filter(e => e.id !== id)); onRefresh(); } else alert('Error al eliminar');
  }

  async function handleRechazar(id: number) {
    const obs = prompt('Observaciones para rechazar:');
    if (!obs) return;
    const r = await fetch(`${API}/evidencias/${id}/rechazar`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ observaciones: obs }), credentials: 'include' });
    if (r.ok) { const updated = await r.json(); setEvidencias(prev => prev.map(e => e.id === id ? updated : e)); onRefresh(); } else alert('Error al rechazar');
  }

  async function handleRestaurar(id: number) {
    if (!confirm('¿Restaurar esta evidencia?')) return;
    const r = await fetch(`${API}/evidencias/${id}/restaurar`, { method: 'PATCH', credentials: 'include' });
    if (r.ok) { const updated = await r.json(); setEvidencias(prev => prev.map(e => e.id === id ? updated : e)); onRefresh(); } else alert('Error al restaurar');
  }

  const isBorrador = planilla?.estado === 'borrador';

  if (!avanceItemId) return null;

  return createPortal((
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem', pr: 6 }}>
        Evidencia Fotográfica — Item N°{avance?.item?.numero ?? '?'}: {avance?.descripcion ?? avance?.item?.descripcion ?? ''}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Upload form */}
        {isBorrador && (
          <Card variant="outlined" sx={{ mb: 3, borderStyle: 'dashed' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontFamily: 'var(--font-serif), Georgia, serif' }}>Agregar Foto</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Button variant="contained" component="label" size="small" startIcon={<CameraAltIcon />} disabled={uploading}>
                  Tomar Foto / Subir
                  <input type="file" accept="image/jpeg,image/png" capture="environment" onChange={handleUpload} hidden />
                </Button>
                {uploading && <CircularProgress size={20} sx={{ color: 'rgba(100,180,255,0.5)' }} />}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Categoría" value={uploadCategoria} onChange={e => setUploadCategoria(e.target.value)} size="small" sx={{ minWidth: 160 }}>
                  <MenuItem value="VISTA_GENERAL">Vista General</MenuItem>
                  <MenuItem value="DETALLE_CONSTRUCCION">Detalle Construcción</MenuItem>
                  <MenuItem value="MATERIAL">Material</MenuItem>
                  <MenuItem value="EQUIPO">Equipo</MenuItem>
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="ANTES">Antes</MenuItem>
                  <MenuItem value="DESPUES">Después</MenuItem>
                </TextField>
                <TextField label="Descripción (opcional)" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} size="small" fullWidth />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Evidencias grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: 'rgba(100,180,255,0.5)' }} /></Box>
        ) : evidencias.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'rgba(150,200,255,0.4)', textAlign: 'center', py: 4 }}>No hay evidencia fotográfica para este ítem</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {evidencias.map(foto => {
              const chipColor = foto.verificacionEstado === 'VERIFICADO' ? 'success' as const : foto.verificacionEstado === 'SOSPECHOSO' ? 'warning' as const : foto.verificacionEstado === 'RECHAZADO' ? 'error' as const : 'default' as const;
              return (
                <Card key={foto.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Box onClick={() => setExpandedFoto(expandedFoto === foto.id ? null : foto.id)}
                    sx={{ aspectRatio: '16/9', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', overflow: 'hidden' }}>
                    <img src={foto.url} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={foto.verificacionEstado} color={chipColor} size="small" variant="filled" />
                      <Chip label={foto.categoria} size="small" variant="outlined" />
                    </Box>
                    {foto.descripcion && <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>{foto.descripcion}</Typography>}
                    {foto.exifTieneGPS && (
                      <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>
                        GPS: {foto.exifLatitud?.toFixed(6)}, {foto.exifLongitud?.toFixed(6)}
                        {foto.verificacionDistancia != null && <> · <strong>{foto.verificacionDistancia}m</strong> de la obra</>}
                      </Typography>
                    )}
                    {foto.exifFechaCaptura && (
                      <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>Captura: {new Date(foto.exifFechaCaptura).toLocaleString('es-BO')}</Typography>
                    )}
                    {foto.exifDispositivo && (
                      <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>Dispositivo: {foto.exifDispositivo} {foto.exifModeloCamara}</Typography>
                    )}
                    {foto.verificacionObservaciones && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,180,0,0.8)' }}>{foto.verificacionObservaciones}</Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
                      {isBorrador && (
                        <Button size="small" variant="text" color="error" startIcon={<DeleteIcon />} sx={{ fontSize: '0.625rem' }} onClick={() => handleDelete(foto.id)}>Eliminar</Button>
                      )}
                      {foto.verificacionEstado === 'RECHAZADO' && (
                        <Button size="small" variant="text" startIcon={<RestoreIcon />} sx={{ fontSize: '0.625rem' }} onClick={() => handleRestaurar(foto.id)}>Restaurar</Button>
                      )}
                      {foto.verificacionEstado !== 'RECHAZADO' && (
                        <Button size="small" variant="text" startIcon={<BlockIcon />} sx={{ fontSize: '0.625rem', color: 'rgba(255,180,0,0.7)' }} onClick={() => handleRechazar(foto.id)}>Rechazar</Button>
                      )}
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </DialogContent>

      {/* Expanded foto modal */}
      {expandedFoto != null && createPortal((
        <Dialog open onClose={() => setExpandedFoto(null)} maxWidth="xl" slotProps={{ paper: { sx: { background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', boxShadow: 'none' } } }}>
          <IconButton onClick={() => setExpandedFoto(null)} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, color: 'white' }}><CloseIcon /></IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', p: 2 }}>
            <img src={evidencias.find(e => e.id === expandedFoto)?.url} alt="Evidencia ampliada"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
          </Box>
        </Dialog>
      ), document.body)}
    </Dialog>
  ), document.body);
}
