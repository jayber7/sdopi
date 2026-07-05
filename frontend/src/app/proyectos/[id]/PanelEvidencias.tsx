'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API = '/api';

interface Evidencia {
  id: number;
  url: string;
  publicId: string;
  exifLatitud: number | null;
  exifLongitud: number | null;
  exifAltitud: number | null;
  exifFechaCaptura: string | null;
  exifDispositivo: string | null;
  exifModeloCamara: string | null;
  exifTieneGPS: boolean;
  verificacionEstado: string;
  verificacionDistancia: number | null;
  verificacionRadio: number;
  verificacionFuente: string | null;
  verificacionObservaciones: string | null;
  categoria: string;
  descripcion: string | null;
  avanceItemId: number;
  planillaId: number;
  userId: number;
  createdAt: string;
  user?: { id: number; nombre: string };
  avanceItem?: any;
}

interface EvidenciaStats {
  total: number;
  verificadas: number;
  sospechosas: number;
  rechazadas: number;
  pendientes: number;
  itemsSinEvidencia: number;
  itemsTotal: number;
  porItem: Record<number, { count: number; mejorEstado: string | null }>;
}

export function EvidenciaStatsButton({ planillaId, onClick }: { planillaId: number; onClick: () => void }) {
  const [stats, setStats] = useState<EvidenciaStats | null>(null);

  useEffect(() => {
    fetch(`${API}/planillas/${planillaId}/fotos/stats`, { credentials: 'include' })
      .then(r => r.ok && r.json())
      .then(setStats)
      .catch(() => {});
  }, [planillaId]);

  if (!stats || stats.itemsTotal === 0) return null;

  const allOk = stats.verificadas >= stats.itemsTotal && stats.rechazadas === 0;
  const hasRejected = stats.rechazadas > 0;
  const hasSuspicious = stats.sospechosas > 0;

  const badgeClass = allOk ? 'badge-success' : hasRejected ? 'badge-error' : hasSuspicious ? 'badge-warning' : 'badge-muted';

  return (
    <button onClick={onClick} className={`btn btn-outline btn-sm`} title="Panel de evidencias">
      📷 Evidencias: <span className={`badge ${badgeClass}`} style={{ margin: '0 4px' }}>{stats.verificadas}/{stats.itemsTotal}</span> verificadas
    </button>
  );
}

export function PanelGeneralEvidencias({
  planilla,
  onClose,
  onOpenItem,
}: {
  planilla: any;
  onClose: () => void;
  onOpenItem: (avanceItemId: number) => void;
}) {
  const [stats, setStats] = useState<EvidenciaStats | null>(null);

  useEffect(() => {
    fetch(`${API}/planillas/${planilla.id}/fotos/stats`, { credentials: 'include' })
      .then(r => r.ok && r.json())
      .then(setStats);
  }, [planilla.id]);

  const groups = groupAvances(planilla.avances);

  return createPortal((
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '80vh' }}>
        <div className="dialog-header">
          <h3>Panel General de Evidencias</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ fontSize: '1.125rem', lineHeight: 1, padding: '2px 8px' }}>&times;</button>
        </div>
        <div className="dialog-body" style={{ overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
          {stats && (
            <div className="flex gap-3 mb-4 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              <span>Total: <strong>{stats.total}</strong></span>
              <span style={{ color: 'var(--color-success)' }}>Verificadas: <strong>{stats.verificadas}</strong></span>
              <span style={{ color: 'var(--color-warning)' }}>Sospechosas: <strong>{stats.sospechosas}</strong></span>
              <span style={{ color: 'var(--color-error)' }}>Rechazadas: <strong>{stats.rechazadas}</strong></span>
              {stats.itemsSinEvidencia > 0 && <span style={{ color: 'var(--color-accent)' }}>Sin evidencia: <strong>{stats.itemsSinEvidencia}</strong></span>}
            </div>
          )}
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th style={{ minWidth: 200 }}>Descripción</th>
                <th className="text-center">Fotos</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g: any) => (
                <Fragment key={g.rubroId ?? g.codigo}>
                  <tr style={{ background: 'var(--color-primary-faint)' }}>
                    <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>
                      {g.codigo} - {g.nombre}
                    </td>
                  </tr>
                  {g.avances.map((av: any) => {
                    const ev = stats?.porItem[av.id];
                    const estado = ev?.mejorEstado || null;
                    const badgeClass = estado === 'VERIFICADO' ? 'badge-success' : estado === 'SOSPECHOSO' ? 'badge-warning' : estado === 'RECHAZADO' ? 'badge-error' : 'badge-muted';
                    return (
                      <tr key={av.id}>
                        <td>{av.item?.numero ?? 'N'}</td>
                        <td>{av.descripcion ?? av.item?.descripcion ?? ''}</td>
                        <td className="text-center">{ev?.count || 0}</td>
                        <td className="text-center">
                          {estado ? <span className={`badge ${badgeClass}`}>{estado}</span> : <span className="badge badge-muted">—</span>}
                        </td>
                        <td className="text-center">
                          <button onClick={() => { onClose(); onOpenItem(av.id); }} className="btn btn-outline btn-xs">Ver</button>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ), document.body);
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

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

export function PanelEvidencias({
  planilla,
  avanceItemId,
  onClose,
  onRefresh,
}: {
  planilla: any;
  avanceItemId: number | null;
  onClose: () => void;
  onRefresh: () => void;
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
    formData.append('foto', file);
    formData.append('categoria', uploadCategoria);
    if (uploadDesc) formData.append('descripcion', uploadDesc);

    // Try to get browser GPS
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }),
      );
      formData.append('browserGpsLat', String(pos.coords.latitude));
      formData.append('browserGpsLng', String(pos.coords.longitude));
    } catch { /* browser GPS not available */ }

    const r = await fetch(`${API}/planillas/${planilla.id}/fotos/${avanceItemId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    setUploading(false);

    if (r.ok) {
      const foto = await r.json();
      setEvidencias(prev => [foto, ...prev]);
      onRefresh();
      setUploadDesc('');
      setUploadCategoria('VISTA_GENERAL');
    } else {
      const err = await r.json().catch(() => ({ message: 'Error al subir foto' }));
      alert(err.message || 'Error al subir foto');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminar esta evidencia?')) return;
    const r = await fetch(`${API}/evidencias/${id}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) {
      setEvidencias(prev => prev.filter(e => e.id !== id));
      onRefresh();
    } else {
      alert('Error al eliminar');
    }
  }

  async function handleRechazar(id: number) {
    const obs = prompt('Observaciones para rechazar:');
    if (!obs) return;
    const r = await fetch(`${API}/evidencias/${id}/rechazar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observaciones: obs }),
      credentials: 'include',
    });
    if (r.ok) {
      const updated = await r.json();
      setEvidencias(prev => prev.map(e => e.id === id ? updated : e));
      onRefresh();
    } else {
      alert('Error al rechazar');
    }
  }

  async function handleRestaurar(id: number) {
    if (!confirm('¿Restaurar esta evidencia?')) return;
    const r = await fetch(`${API}/evidencias/${id}/restaurar`, {
      method: 'PATCH',
      credentials: 'include',
    });
    if (r.ok) {
      const updated = await r.json();
      setEvidencias(prev => prev.map(e => e.id === id ? updated : e));
      onRefresh();
    } else {
      alert('Error al restaurar');
    }
  }

  const isBorrador = planilla?.estado === 'borrador';
  const user = (window as any).__USER__;

  const badgeClass = (estado: string) =>
    estado === 'VERIFICADO' ? 'badge-success' :
    estado === 'SOSPECHOSO' ? 'badge-warning' :
    estado === 'RECHAZADO' ? 'badge-error' : 'badge-muted';

  if (!avanceItemId) return null;

  return createPortal((
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '85vh' }}>
        <div className="dialog-header">
          <h3>Evidencia Fotográfica — Item N°{avance?.item?.numero ?? '?'}: {avance?.descripcion ?? avance?.item?.descripcion ?? ''}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ fontSize: '1.125rem', lineHeight: 1, padding: '2px 8px' }}>&times;</button>
        </div>
        <div className="dialog-body" style={{ overflow: 'auto', maxHeight: 'calc(85vh - 120px)' }}>
          {/* Upload form */}
          {(isBorrador) && (
            <div className="card mb-4" style={{ borderStyle: 'dashed' }}>
              <div className="card-body space-y-3">
                <h4 style={{ fontSize: '0.875rem' }}>Agregar Foto</h4>
                <input type="file" accept="image/jpeg,image/png" capture="environment"
                  onChange={handleUpload} className="input input-sm" disabled={uploading}
                  style={{ padding: '4px' }} />
                <div className="flex gap-3">
                  <select value={uploadCategoria} onChange={e => setUploadCategoria(e.target.value)} className="input input-sm">
                    <option value="VISTA_GENERAL">Vista General</option>
                    <option value="DETALLE_CONSTRUCCION">Detalle Construcción</option>
                    <option value="MATERIAL">Material</option>
                    <option value="EQUIPO">Equipo</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="ANTES">Antes</option>
                    <option value="DESPUES">Después</option>
                  </select>
                  <input placeholder="Descripción (opcional)" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="input input-sm flex-1" />
                </div>
                {uploading && <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Subiendo...</p>}
              </div>
            </div>
          )}

          {/* Evidencias grid */}
          {loading ? (
            <p style={{ color: 'var(--color-ink-muted)' }}>Cargando...</p>
          ) : evidencias.length === 0 ? (
            <p style={{ color: 'var(--color-ink-muted)' }}>No hay evidencia fotográfica para este ítem</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {evidencias.map(foto => (
                <div key={foto.id} className="card" style={{ overflow: 'hidden' }}>
                  <div
                    className="cursor-pointer"
                    style={{ aspectRatio: '16/9', background: 'var(--color-border-light)', overflow: 'hidden' }}
                    onClick={() => setExpandedFoto(expandedFoto === foto.id ? null : foto.id)}>
                    <img src={foto.url} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`badge ${badgeClass(foto.verificacionEstado)}`} style={{ padding: '2px 6px', fontSize: '0.6875rem' }}>
                        {foto.verificacionEstado}
                      </span>
                      <span className="badge badge-muted" style={{ fontSize: '0.625rem' }}>{foto.categoria}</span>
                    </div>
                    {foto.descripcion && <p style={{ color: 'var(--color-ink-muted)' }}>{foto.descripcion}</p>}
                    {foto.exifTieneGPS && (
                      <p>
                        <span style={{ color: 'var(--color-ink-muted)' }}>GPS:</span>{' '}
                        {foto.exifLatitud?.toFixed(6)}, {foto.exifLongitud?.toFixed(6)}
                        {foto.verificacionDistancia != null && (
                          <span> · <strong>{foto.verificacionDistancia}m</strong> de la obra</span>
                        )}
                      </p>
                    )}
                    {foto.exifFechaCaptura && (
                      <p><span style={{ color: 'var(--color-ink-muted)' }}>Captura:</span> {new Date(foto.exifFechaCaptura).toLocaleString('es-BO')}</p>
                    )}
                    {foto.exifDispositivo && (
                      <p><span style={{ color: 'var(--color-ink-muted)' }}>Dispositivo:</span> {foto.exifDispositivo} {foto.exifModeloCamara}</p>
                    )}
                    {foto.verificacionObservaciones && (
                      <p style={{ color: 'var(--color-warning)' }}>{foto.verificacionObservaciones}</p>
                    )}
                    <div className="flex gap-1 pt-1">
                      {(isBorrador) && (
                        <button onClick={() => handleDelete(foto.id)} className="btn btn-danger btn-xs">Eliminar</button>
                      )}
                      {foto.verificacionEstado === 'RECHAZADO' && (window as any).__USER__?.role === 'admin' && (
                        <button onClick={() => handleRestaurar(foto.id)} className="btn btn-outline btn-xs">Restaurar</button>
                      )}
                      {(foto.verificacionEstado !== 'RECHAZADO') && (
                        <button onClick={() => handleRechazar(foto.id)} className="btn btn-warning btn-xs">Rechazar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded foto modal */}
      {expandedFoto != null && createPortal((
        <div className="dialog-backdrop" onClick={() => setExpandedFoto(null)} style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={evidencias.find(e => e.id === expandedFoto)?.url} alt="Evidencia ampliada"
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        </div>
      ), document.body)}
    </div>
  ), document.body);
}
