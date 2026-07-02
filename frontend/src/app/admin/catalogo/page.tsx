'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const jefaturas = ['DI', 'JE', 'JT', 'JUPRE', 'JUS'];

interface CatalogoRubro {
  id: number; jefatura: string; nombre: string; _count: { items: number };
}
interface CatalogoItem {
  id: number; numero: number; descripcion: string; unidad: string; rubroCatalogoId: number;
}

async function apiFetch(method: string, url: string, body?: any) {
  const r = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body), credentials: 'include',
  });
  if (!r.ok) { const t = await r.text().catch(() => ''); alert(`Error ${r.status}: ${t || r.statusText}`); throw new Error(`${r.status} ${t}`); }
  return r.json().catch(() => null);
}

export default function AdminCatalogoPage() {
  const { user, loading: authLoading } = useAuth();
  const [jefatura, setJefatura] = useState('DI');
  const [rubros, setRubros] = useState<CatalogoRubro[]>([]);
  const [items, setItems] = useState<Record<number, CatalogoItem[]>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editRubro, setEditRubro] = useState<{ id?: number; jefatura: string; nombre: string } | null>(null);
  const [editItem, setEditItem] = useState<{ id?: number; rubroCatalogoId: number; numero: number; descripcion: string; unidad: string } | null>(null);
  const [showCsv, setShowCsv] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' })
      .then(r => r.ok && r.json()).then(setRubros);
    setItems({}); setExpanded({});
  }, [jefatura]);

  async function loadItems(rubroId: number) {
    if (items[rubroId]) return;
    const r = await fetch(`${API}/catalogo/rubros/${rubroId}/items`, { credentials: 'include' });
    if (r.ok) { const data = await r.json(); setItems(p => ({ ...p, [rubroId]: data })); }
  }

  function toggleRubro(id: number) {
    setExpanded(p => ({ ...p, [id]: !p[id] }));
    loadItems(id);
  }

  async function saveRubro() {
    if (!editRubro) return;
    try {
      if (editRubro.id) {
        await apiFetch('PATCH', `${API}/catalogo/rubros/${editRubro.id}`, { nombre: editRubro.nombre });
      } else {
        await apiFetch('POST', `${API}/catalogo/rubros`, { jefatura: editRubro.jefatura, nombre: editRubro.nombre });
      }
      setEditRubro(null);
      const r = await fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' });
      if (r.ok) setRubros(await r.json());
    } catch {}
  }

  async function deleteRubro(id: number) {
    if (!confirm('Eliminar rubro y todos sus items del catálogo?')) return;
    try {
      await apiFetch('DELETE', `${API}/catalogo/rubros/${id}`);
      setRubros(p => p.filter(r => r.id !== id));
      setItems(p => { const n = { ...p }; delete n[id]; return n; });
    } catch {}
  }

  async function saveItem() {
    if (!editItem) return;
    try {
      if (editItem.id) {
        await apiFetch('PATCH', `${API}/catalogo/items/${editItem.id}`, { numero: editItem.numero, descripcion: editItem.descripcion, unidad: editItem.unidad });
      } else {
        await apiFetch('POST', `${API}/catalogo/rubros/${editItem.rubroCatalogoId}/items`, { numero: editItem.numero, descripcion: editItem.descripcion, unidad: editItem.unidad });
      }
      setEditItem(null);
      await loadItems(editItem.rubroCatalogoId);
      const r = await fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' });
      if (r.ok) setRubros(await r.json());
    } catch {}
  }

  async function deleteItem(id: number, rubroId: number) {
    if (!confirm('Eliminar item del catálogo?')) return;
    try {
      await apiFetch('DELETE', `${API}/catalogo/items/${id}`);
      setItems(p => ({ ...p, [rubroId]: p[rubroId]?.filter(i => i.id !== id) || [] }));
      const r = await fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' });
      if (r.ok) setRubros(await r.json());
    } catch {}
  }

  async function importCsv() {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const result = await apiFetch('POST', `${API}/catalogo/importar-csv`, { jefatura, csv: csvText });
      alert(`Importado: ${result.rubrosCreados} rubros nuevos, ${result.rubrosExistentes} existentes, ${result.itemsAgregados} items`);
      setCsvText(''); setShowCsv(false);
      const r = await fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' });
      if (r.ok) setRubros(await r.json());
    } catch { setImporting(false); }
  }

  if (authLoading) return null;
  if (!user || (user.role !== 'admin' && user.role !== 'operador')) {
    return <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>Acceso restringido</p>;
  }

  return (
    <div className="page-full animate-fade-in">
      <div className="space-y-6">
        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl">Catálogo de Rubros e Items</h1>
              <div className="flex flex-wrap items-center gap-2">
                <select value={jefatura} onChange={e => setJefatura(e.target.value)} className="input input-sm" style={{ width: 110 }}>
                  {jefaturas.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <button onClick={() => setEditRubro({ jefatura, nombre: '' })} className="btn btn-success btn-sm">+ Nuevo Rubro</button>
                <button onClick={() => setShowCsv(p => !p)} className="btn btn-outline btn-sm">⬆ Importar CSV</button>
              </div>
            </div>
          </div>
        </div>

        {showCsv && (
          <div className="card animate-slide-down">
            <div className="card-header"><h3 style={{ fontSize: '0.9375rem' }}>Importar CSV</h3></div>
            <div className="card-body space-y-3">
              <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                Formato: línea de rubro (nombre, vacío), líneas de item (descripción, unidad). Repetir.
              </p>
              <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8} className="input" placeholder="M01 - DEMOLICIONES,&#10;Demolición de muros, m²&#10;Demolición de losas, m²&#10;M02 - MOVIMIENTO DE TIERRAS,&#10;Excavación general, m³" />
              <button onClick={importCsv} disabled={importing || !csvText.trim()} className="btn btn-primary btn-sm">Importar</button>
            </div>
          </div>
        )}

        {/* Inline new rubro form */}
        {editRubro && !editRubro.id && (
          <div className="card flex items-center gap-2 px-3 py-2" style={{ flexDirection: 'row', borderStyle: 'dashed' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>Nuevo rubro en {editRubro.jefatura}:</span>
            <input placeholder="Nombre del rubro (ej: M01 - DEMOLICIONES)" value={editRubro.nombre} onChange={e => setEditRubro({ ...editRubro, nombre: e.target.value })} className="input input-sm flex-1" />
            <button onClick={saveRubro} className="btn btn-primary btn-xs">Guardar</button>
            <button onClick={() => setEditRubro(null)} className="btn btn-ghost btn-xs">Cancelar</button>
          </div>
        )}

        {/* Rubro list */}
        {rubros.map(r => (
          <div key={r.id} className="card">
            {editRubro?.id === r.id ? (
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <input value={editRubro.nombre} onChange={e => setEditRubro({ ...editRubro, nombre: e.target.value })} className="input input-sm flex-1" />
                <button onClick={saveRubro} className="btn btn-primary btn-xs">Guardar</button>
                <button onClick={() => setEditRubro(null)} className="btn btn-ghost btn-xs">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <button onClick={() => toggleRubro(r.id)} className="flex items-center gap-2 text-left flex-1">
                  <span className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>{expanded[r.id] ? '▾' : '▸'}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>{r.nombre}</span>
                  <span className="badge badge-muted text-xs">{r._count.items} items</span>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditRubro({ id: r.id, jefatura: r.jefatura, nombre: r.nombre })} className="btn btn-ghost btn-xs">Editar</button>
                  <button onClick={() => deleteRubro(r.id)} className="btn btn-danger btn-xs">Eliminar</button>
                </div>
              </div>
            )}

            {expanded[r.id] && (
              <div>
                {(items[r.id] && items[r.id].length > 0) && (
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>N°</th>
                        <th>Descripción</th>
                        <th style={{ width: 60 }}>Und</th>
                        <th style={{ width: 100 }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items[r.id].map(ci => {
                        if (editItem?.id === ci.id) {
                          return (
                            <tr key={ci.id}>
                              <td><input type="number" value={editItem.numero} onChange={e => setEditItem({ ...editItem, numero: +e.target.value })} className="input input-sm w-14" /></td>
                              <td><input value={editItem.descripcion} onChange={e => setEditItem({ ...editItem, descripcion: e.target.value })} className="input input-sm w-full" /></td>
                              <td><input value={editItem.unidad} onChange={e => setEditItem({ ...editItem, unidad: e.target.value })} className="input input-sm w-16" /></td>
                              <td>
                                <button onClick={saveItem} className="btn btn-primary btn-xs mr-1">Guardar</button>
                                <button onClick={() => setEditItem(null)} className="btn btn-ghost btn-xs">Cancelar</button>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={ci.id}>
                            <td>{ci.numero}</td>
                            <td>{ci.descripcion}</td>
                            <td>{ci.unidad}</td>
                            <td>
                              <button onClick={() => setEditItem({ id: ci.id, rubroCatalogoId: r.id, numero: ci.numero, descripcion: ci.descripcion, unidad: ci.unidad })} className="btn btn-ghost btn-xs mr-1">Editar</button>
                              <button onClick={() => deleteItem(ci.id, r.id)} className="btn btn-danger btn-xs">Eliminar</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {(editItem?.rubroCatalogoId === r.id && !items[r.id]?.find(i => i.id === editItem.id)) && (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid var(--color-border-light)', background: 'var(--color-accent-faint)' }}>
                    <input type="number" value={editItem.numero} onChange={e => setEditItem({ ...editItem, numero: +e.target.value })} className="input input-sm w-14" placeholder="N°" />
                    <input value={editItem.descripcion} onChange={e => setEditItem({ ...editItem, descripcion: e.target.value })} className="input input-sm flex-1" placeholder="Descripción" />
                    <input value={editItem.unidad} onChange={e => setEditItem({ ...editItem, unidad: e.target.value })} className="input input-sm w-16" placeholder="Und" />
                    <button onClick={saveItem} className="btn btn-primary btn-xs">Guardar</button>
                    <button onClick={() => setEditItem(null)} className="btn btn-ghost btn-xs">Cancelar</button>
                  </div>
                )}

                {(!editItem || editItem.rubroCatalogoId !== r.id) && (
                  <div className="px-3 py-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <button onClick={() => setEditItem({ rubroCatalogoId: r.id, numero: (items[r.id]?.length || 0) + 1, descripcion: '', unidad: '' })} className="btn btn-outline btn-xs">+ Agregar Item</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {rubros.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--color-ink-faint)' }}>Sin rubros en {jefatura}. Crea uno nuevo o importa CSV.</p>
        )}
      </div>
    </div>
  );
}
