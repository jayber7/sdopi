'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as exifr from 'exifr';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
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
import EditIcon from '@mui/icons-material/Edit';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
    const ac = new AbortController();
    fetch(`${API}/planillas/${planillaId}/fotos/stats`, { credentials: 'include', signal: ac.signal })
      .then(r => r.ok && r.json()).then(setStats).catch(() => {});
    return () => ac.abort();
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
    const ac = new AbortController();
    fetch(`${API}/planillas/${planilla.id}/fotos/stats`, { credentials: 'include', signal: ac.signal })
      .then(r => r.ok && r.json()).then(setStats);
    return () => ac.abort();
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
    const rc = a.rubroCod ?? a.item?.rubro?.codigo ?? 'SIN';
    const rn = a.rubroNombre ?? a.item?.rubro?.nombre ?? 'Sin Rubro';
    const rubroId = rubro?.id ?? null;
    const key = rubro ? `r${rubro.id}` : rc;
    if (!map.has(key)) map.set(key, { codigo: rc, nombre: rn, rubroId, avances: [] });
    map.get(key)!.avances.push(a);
  }
  return [...map.values()];
}

export function PanelEvidencias({ planilla, avanceItemId, onClose, onRefresh, proyectoLat, proyectoLng }: {
  planilla: any; avanceItemId: number | null; onClose: () => void; onRefresh: () => void;
  proyectoLat?: number | null; proyectoLng?: number | null;
}) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFoto, setExpandedFoto] = useState<number | null>(null);
  const [uploadCategoria, setUploadCategoria] = useState('VISTA_GENERAL');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editDescId, setEditDescId] = useState<number | null>(null);
  const [editDescVal, setEditDescVal] = useState('');
  const [uploadExif, setUploadExif] = useState<{
    latitud: number | null; longitud: number | null;
    fechaCaptura: string | null; dispositivo: string | null; modeloCamara: string | null;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mainMapReady, setMainMapReady] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const mainMapRef = useRef<HTMLDivElement>(null);
  const mainMapInstance = useRef<L.Map | null>(null);

  const avance = avanceItemId ? planilla?.avances?.find((a: any) => a.id === avanceItemId) : null;

  useEffect(() => {
    if (!planilla || !avanceItemId) return;
    const ac = new AbortController();
    setLoading(true);
    fetch(`${API}/planillas/${planilla.id}/fotos`, { credentials: 'include', signal: ac.signal })
      .then(r => r.ok && r.json())
      .then(data => setEvidencias(data.filter((e: Evidencia) => e.avanceItemId === avanceItemId)))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [planilla?.id, avanceItemId]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (!mainMapReady || !mainMapRef.current) return;
    if (proyectoLat == null || proyectoLng == null) return;
    if (mainMapInstance.current) { mainMapInstance.current.remove(); mainMapInstance.current = null; }
    const center: [number, number] = [proyectoLat!, proyectoLng!];
    const map = L.map(mainMapRef.current, { zoomControl: false }).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.circleMarker(center, { radius: 10, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7 })
      .addTo(map).bindTooltip('Proyecto');
    const bounds = L.latLngBounds(center, center);
    for (const foto of evidencias) {
      if (foto.exifLatitud == null || foto.exifLongitud == null) continue;
      const color = foto.verificacionEstado === 'VERIFICADO' ? '#22c55e'
        : foto.verificacionEstado === 'SOSPECHOSO' ? '#f59e0b'
        : foto.verificacionEstado === 'RECHAZADO' ? '#ef4444' : '#6b7280';
      L.circleMarker([foto.exifLatitud, foto.exifLongitud], { radius: 7, color, fillColor: color, fillOpacity: 0.7 })
        .addTo(map).bindTooltip(`${foto.verificacionEstado}${foto.verificacionDistancia != null ? ` · ${foto.verificacionDistancia}m` : ''}`);
      bounds.extend([foto.exifLatitud, foto.exifLongitud]);
    }
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    setTimeout(() => map.invalidateSize(), 100);
    mainMapInstance.current = map;
    return () => { map.remove(); mainMapInstance.current = null; };
  }, [mainMapReady, evidencias, proyectoLat, proyectoLng]);

  useEffect(() => {
    if (!expandedFoto || !mapReady || !mapRef.current) return;
    const foto = evidencias.find(e => e.id === expandedFoto);
    if (!foto?.exifTieneGPS || proyectoLat == null || proyectoLng == null) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    const map = L.map(mapRef.current, { zoomControl: false }).setView([proyectoLat, proyectoLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.circleMarker([proyectoLat, proyectoLng], { radius: 10, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7 })
      .addTo(map).bindTooltip('Proyecto');
    if (foto.exifLatitud != null && foto.exifLongitud != null) {
      L.circleMarker([foto.exifLatitud, foto.exifLongitud], { radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.7 })
        .addTo(map).bindTooltip('Foto');
      const bounds = L.latLngBounds([proyectoLat, proyectoLng], [foto.exifLatitud, foto.exifLongitud]);
      map.fitBounds(bounds, { padding: [40, 40] });
      if (foto.verificacionDistancia != null) {
        L.polyline([[proyectoLat, proyectoLng], [foto.exifLatitud, foto.exifLongitud]], { color: '#f59e0b', weight: 2, dashArray: '6 4' }).addTo(map);
      }
    }
    setTimeout(() => map.invalidateSize(), 100);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [expandedFoto, mapReady, proyectoLat, proyectoLng]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const ex = await exifr.parse(file);
      setUploadExif({
        latitud: ex?.latitude ?? null,
        longitud: ex?.longitude ?? null,
        fechaCaptura: ex?.DateTimeOriginal || ex?.CreateDate || null,
        dispositivo: ex?.Make || null,
        modeloCamara: ex?.Model || null,
      });
    } catch { setUploadExif(null); }
    e.target.value = '';
  }

  async function confirmUpload() {
    if (!selectedFile || !planilla || !avanceItemId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('foto', selectedFile);
    formData.append('categoria', uploadCategoria);
    if (uploadDesc) formData.append('descripcion', uploadDesc);
    if (uploadExif?.latitud != null) formData.append('exifLat', String(uploadExif.latitud));
    if (uploadExif?.longitud != null) formData.append('exifLng', String(uploadExif.longitud));
    if (uploadExif?.fechaCaptura) formData.append('exifFecha', uploadExif.fechaCaptura);
    if (uploadExif?.dispositivo) formData.append('exifDispositivo', uploadExif.dispositivo);
    if (uploadExif?.modeloCamara) formData.append('exifModelo', uploadExif.modeloCamara);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      formData.append('browserGpsLat', String(pos.coords.latitude));
      formData.append('browserGpsLng', String(pos.coords.longitude));
    } catch {}
    const fotoUrl = `${API}/planillas/${planilla.id}/fotos/${avanceItemId}`;
    let r = await fetch(fotoUrl, { method: 'POST', credentials: 'include', body: formData });
    if (r.status === 503) {
      await new Promise(res => setTimeout(res, 3000));
      r = await fetch(fotoUrl, { method: 'POST', credentials: 'include', body: formData });
    }
    setUploading(false);
    if (r.ok) {
      const foto = await r.json();
      setEvidencias(prev => [foto, ...prev]);
      onRefresh();
      setSelectedFile(null); setPreviewUrl(null); setUploadExif(null); setUploadDesc(''); setUploadCategoria('VISTA_GENERAL');
    } else { const err = await r.json().catch(() => ({ message: 'Error al subir foto' })); alert(err.message || 'Error al subir foto'); }
  }

  function cancelUpload() {
    setSelectedFile(null); setPreviewUrl(null); setUploadExif(null); setUploadDesc(''); setUploadCategoria('VISTA_GENERAL');
  }

  async function saveDesc(foto: Evidencia) {
    const r = await fetch(`${API}/evidencias/${foto.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: editDescVal }), credentials: 'include',
    });
    if (r.ok) {
      const updated = await r.json();
      setEvidencias(prev => prev.map(e => e.id === foto.id ? updated : e));
      setEditDescId(null);
    }
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
    <Dialog open onClose={onClose} maxWidth="xl" fullWidth
      slotProps={{ transition: { onEntered: () => setMainMapReady(true) } as any }}>
      <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem', pr: 6 }}>
        Evidencia Fotográfica — Item N°{avance?.item?.numero ?? '?'}: {avance?.descripcion ?? avance?.item?.descripcion ?? ''}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Map */}
        {proyectoLat != null && proyectoLng != null && (
          <Box ref={mainMapRef} sx={{ width: '100%', height: 220, borderRadius: 1.5, overflow: 'hidden', mb: 2 }} />
        )}

        {/* Upload form */}
        {isBorrador && (
          <Card variant="outlined" sx={{ mb: 3, borderStyle: 'dashed' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontFamily: 'var(--font-serif), Georgia, serif' }}>Agregar Foto</Typography>
              {!selectedFile ? (
                <>
                  <Button variant="contained" component="label" size="small" startIcon={<CameraAltIcon />}>
                    Tomar Foto / Subir
                    <input type="file" accept="image/jpeg,image/png" capture="environment" onChange={handleFileSelect} hidden />
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
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
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Box sx={{ width: 120, height: 90, borderRadius: 1, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.03)' }}>
                      <img src={previewUrl!} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
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
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                    {uploadExif && (
                      <Box sx={{ fontSize: '0.75rem', color: 'rgba(150,200,255,0.6)', display: 'flex', flexDirection: 'column', gap: 0.3, flex: 1 }}>
                        {uploadExif.latitud != null && <span>GPS: {uploadExif.latitud.toFixed(6)}, {uploadExif.longitud?.toFixed(6)}</span>}
                        {uploadExif.fechaCaptura && <span>Captura: {new Date(uploadExif.fechaCaptura).toLocaleString('es-BO')}</span>}
                        {uploadExif.dispositivo && <span>Dispositivo: {uploadExif.dispositivo} {uploadExif.modeloCamara ?? ''}</span>}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ...(uploadExif ? { ml: 'auto' } : {}) }}>
                      <Button variant="contained" size="small" startIcon={uploading ? <CircularProgress size={16} /> : undefined} onClick={confirmUpload} disabled={uploading}>
                        {uploading ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button variant="outlined" size="small" onClick={cancelUpload} disabled={uploading}>Cancelar</Button>
                    </Box>
                  </Box>
                </>
              )}
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
                    <img src={foto.url} alt="Evidencia" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={foto.verificacionEstado} color={chipColor} size="small" variant="filled" />
                      <Chip label={foto.categoria} size="small" variant="outlined" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {editDescId === foto.id ? (
                        <>
                          <TextField size="small" value={editDescVal} onChange={e => setEditDescVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveDesc(foto); if (e.key === 'Escape') setEditDescId(null); }}
                            sx={{ flex: 1 }} slotProps={{ htmlInput: { style: { fontSize: '0.75rem', padding: '4px 8px' } } }} autoFocus />
                          <Button size="small" variant="contained" sx={{ minWidth: 0, p: 0.5 }} onClick={() => saveDesc(foto)}>✓</Button>
                          <Button size="small" variant="text" sx={{ minWidth: 0, p: 0.5 }} onClick={() => setEditDescId(null)}>✕</Button>
                        </>
                      ) : (
                        <>
                          {foto.descripcion && <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)', flex: 1 }}>{foto.descripcion}</Typography>}
                          {isBorrador && (
                            <IconButton size="small" onClick={() => { setEditDescId(foto.id); setEditDescVal(foto.descripcion || ''); }} sx={{ color: 'rgba(150,200,255,0.35)', p: 0.3 }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </>
                      )}
                    </Box>
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
        <Dialog open onClose={() => { setExpandedFoto(null); setMapReady(false); }} maxWidth="xl"
          slotProps={{ transition: { onEntered: () => setMapReady(true) } as any, paper: { sx: { background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', boxShadow: 'none' } } }}>
          <IconButton onClick={() => { setExpandedFoto(null); setMapReady(false); }} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, color: 'white' }}><CloseIcon /></IconButton>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: '80vh', p: 2 }}>
            <Box sx={{ flex: 1, maxWidth: '70%' }}>
              <img src={evidencias.find(e => e.id === expandedFoto)?.url} alt="Evidencia ampliada" loading="lazy"
                style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
            </Box>
            {(() => {
              const foto = evidencias.find(e => e.id === expandedFoto);
              if (!foto?.exifTieneGPS || proyectoLat == null || proyectoLng == null) {
                return (
                  <Box sx={{ width: { xs: '100%', md: 320 }, height: 320, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, bgcolor: 'rgba(255,255,255,0.03)', color: 'rgba(150,200,255,0.4)', fontSize: '0.75rem', px: 2, textAlign: 'center' }}>
                    {proyectoLat == null || proyectoLng == null
                      ? 'El proyecto no tiene coordenadas configuradas'
                      : 'La foto no contiene datos de ubicación GPS'}
                  </Box>
                );
              }
              return (
                <Box ref={mapRef} sx={{ width: { xs: '100%', md: 320 }, height: 320, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }} />
              );
            })()}
          </Box>
        </Dialog>
      ), document.body)}
    </Dialog>
  ), document.body);
}
