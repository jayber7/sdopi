'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';

const API = '/api';
const jefaturas = ['DI', 'UDETRA', 'UEH', 'UPRADE', 'UNASVI'];

interface CatalogoRubro { id: number; jefatura: string; nombre: string; _count: { items: number }; }
interface CatalogoItem { id: number; numero: number; descripcion: string; unidad: string; rubroCatalogoId: number; }

async function apiFetch(method: string, url: string, body?: any) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), credentials: 'include' });
  if (!r.ok) { const t = await r.text().catch(() => ''); alert(`Error ${r.status}: ${t || r.statusText}`); throw new Error(`${r.status} ${t}`); }
  return r.json().catch(() => null);
}

export default function AdminCatalogoPage() {
  const { user } = useAuth();
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
    const ac = new AbortController();
    fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include', signal: ac.signal }).then(r => r.ok && r.json()).then(setRubros);
    setItems({}); setExpanded({});
    return () => ac.abort();
  }, [jefatura]);

  async function loadItems(rubroId: number, force?: boolean) {
    if (items[rubroId] && !force) return;
    const r = await fetch(`${API}/catalogo/rubros/${rubroId}/items`, { credentials: 'include' });
    if (r.ok) { const data = await r.json(); setItems(p => ({ ...p, [rubroId]: data })); }
  }

  function toggleRubro(id: number) { setExpanded(p => ({ ...p, [id]: !p[id] })); loadItems(id); }

  async function saveRubro() {
    if (!editRubro) return;
    try {
      if (editRubro.id) { await apiFetch('PATCH', `${API}/catalogo/rubros/${editRubro.id}`, { nombre: editRubro.nombre }); }
      else { await apiFetch('POST', `${API}/catalogo/rubros`, { jefatura: editRubro.jefatura, nombre: editRubro.nombre }); }
      setEditRubro(null); fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' }).then(r => r.ok && r.json()).then(setRubros);
    } catch {}
  }

  async function deleteRubro(id: number) {
    if (!confirm('Eliminar rubro del catálogo?')) return;
    try { await apiFetch('DELETE', `${API}/catalogo/rubros/${id}`); setRubros(p => p.filter(r => r.id !== id)); } catch {}
  }

  async function saveItem() {
    if (!editItem) return;
    try {
      if (editItem.id) { await apiFetch('PATCH', `${API}/catalogo/items/${editItem.id}`, { numero: editItem.numero, descripcion: editItem.descripcion, unidad: editItem.unidad }); }
      else { await apiFetch('POST', `${API}/catalogo/items`, { rubroCatalogoId: editItem.rubroCatalogoId, numero: editItem.numero, descripcion: editItem.descripcion, unidad: editItem.unidad }); }
      setEditItem(null); await loadItems(editItem.rubroCatalogoId, true);
    } catch {}
  }

  async function deleteItem(id: number, rubroId: number) {
    if (!confirm('Eliminar item del catálogo?')) return;
    try { await apiFetch('DELETE', `${API}/catalogo/items/${id}`); await loadItems(rubroId, true); } catch {}
  }

  async function importCsv() {
    setImporting(true);
    try {
      const lines = csvText.trim().split('\n').filter(Boolean);
      let ok = 0, err = 0;
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 2) { err++; continue; }
        const nombreRubro = parts[0].trim();
        const descripcionItem = parts.slice(1).join(',').trim();
        let rubro = rubros.find(r => r.nombre === nombreRubro);
        if (!rubro) {
          const r = await apiFetch('POST', `${API}/catalogo/rubros`, { jefatura, nombre: nombreRubro });
          if (r) { rubro = { id: r.id, jefatura, nombre: nombreRubro, _count: { items: 0 } }; setRubros(p => [...p, rubro!]); }
        }
        if (rubro) {
          await apiFetch('POST', `${API}/catalogo/items`, { rubroCatalogoId: rubro.id, numero: (items[rubro.id]?.length || 0) + 1, descripcion: descripcionItem, unidad: '' });
          ok++;
        } else err++;
      }
      alert(`Importación completada: ${ok} items creados, ${err} errores`);
      setShowCsv(false); setCsvText('');
      fetch(`${API}/catalogo/rubros?jefatura=${jefatura}`, { credentials: 'include' }).then(r => r.ok && r.json()).then(setRubros);
      setItems({});
    } catch (e) { alert('Error en importación: ' + e); }
    finally { setImporting(false); }
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>Catálogo de Rubros</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => setShowCsv(!showCsv)}>Importar CSV</Button>
        </Box>
      </Box>

      <ToggleButtonGroup value={jefatura} exclusive onChange={(_, v) => v && setJefatura(v)} size="small" sx={{ mb: 3 }}>
        {jefaturas.map(j => <ToggleButton key={j} value={j}>{j}</ToggleButton>)}
      </ToggleButtonGroup>

      {showCsv && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '0.9375rem', mb: 1 }}>Importar CSV</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)', display: 'block', mb: 1 }}>
              Formato: una línea por item, <strong>NombreRubro,DescripciónItem</strong>
            </Typography>
            <TextField multiline rows={6} value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={`MOVIMIENTO DE TIERRAS,Excavación manual\nMOVIMIENTO DE TIERRAS,Relleno compactado\nHORMIGÓN,Hormigón estructural H-21`} fullWidth size="small" sx={{ mb: 1, fontFamily: 'monospace' }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={importCsv} variant="contained" disabled={!csvText.trim() || importing}>{importing ? 'Importando…' : 'Importar'}</Button>
              <Button onClick={() => setShowCsv(false)} variant="outlined">Cancelar</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rubros.map((r) => (
          <Card key={r.id} variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, cursor: 'pointer', '&:hover': { background: 'rgba(100,180,255,0.05)' } }}
              onClick={() => toggleRubro(r.id)}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.nombre}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`${r._count.items} items`} size="small" variant="outlined" />
                <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)' }}>{expanded[r.id] ? '▴' : '▾'}</Typography>
              </Box>
            </Box>
            {expanded[r.id] && (
              <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {(editItem && editItem.rubroCatalogoId === r.id && !editItem.id) && (
                  <Box sx={{ display: 'flex', gap: 1, p: 1, background: 'rgba(255,180,0,0.06)', alignItems: 'center' }}>
                    <TextField type="number" value={editItem.numero} onChange={e => setEditItem({ ...editItem, numero: +e.target.value })} size="small" sx={{ width: 70 }} placeholder="N°" />
                    <TextField value={editItem.descripcion} onChange={e => setEditItem({ ...editItem, descripcion: e.target.value })} size="small" sx={{ flex: 1 }} placeholder="Descripción" />
                    <TextField value={editItem.unidad} onChange={e => setEditItem({ ...editItem, unidad: e.target.value })} size="small" sx={{ width: 80 }} placeholder="Und" />
                    <Button size="small" variant="contained" onClick={saveItem}>Guardar</Button>
                    <Button size="small" variant="text" onClick={() => setEditItem(null)}>Cancelar</Button>
                  </Box>
                )}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 60 }}>N°</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell sx={{ width: 80 }}>Und</TableCell>
                      <TableCell sx={{ width: 120 }} align="right">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items[r.id]?.length ? items[r.id].map((ci) => (
                      <TableRow key={ci.id}>
                        {editItem?.id === ci.id ? (
                          <TableCell colSpan={4}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <TextField type="number" value={editItem.numero} onChange={e => setEditItem({ ...editItem, numero: +e.target.value })} size="small" sx={{ width: 70 }} />
                              <TextField value={editItem.descripcion} onChange={e => setEditItem({ ...editItem, descripcion: e.target.value })} size="small" sx={{ flex: 1 }} />
                              <TextField value={editItem.unidad} onChange={e => setEditItem({ ...editItem, unidad: e.target.value })} size="small" sx={{ width: 80 }} />
                              <Button size="small" variant="contained" onClick={saveItem}>Guardar</Button>
                              <Button size="small" variant="text" onClick={() => setEditItem(null)}>Cancelar</Button>
                            </Box>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell>{ci.numero}</TableCell>
                            <TableCell>{ci.descripcion}</TableCell>
                            <TableCell>{ci.unidad}</TableCell>
                            <TableCell align="right">
                              <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem' }} onClick={() => setEditItem({ id: ci.id, rubroCatalogoId: r.id, numero: ci.numero, descripcion: ci.descripcion, unidad: ci.unidad })}><EditIcon fontSize="small" /></Button>
                              <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: '0.75rem', color: 'rgba(255,107,107,0.7)' }} onClick={() => deleteItem(ci.id, r.id)}><DeleteIcon fontSize="small" /></Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', color: 'rgba(150,200,255,0.4)', py: 3 }}>Sin items</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <Button size="small" startIcon={<AddIcon />} variant="text" sx={{ fontSize: '0.75rem' }} onClick={() => setEditItem({ rubroCatalogoId: r.id, numero: (items[r.id]?.length || 0) + 1, descripcion: '', unidad: '' })}>
                    Nuevo Item
                  </Button>
                </Box>
              </Box>
            )}
          </Card>
        ))}
        {rubros.length === 0 && (
          <Typography sx={{ textAlign: 'center', py: 8, color: 'rgba(150,200,255,0.4)' }}>No hay rubros en esta jefatura.</Typography>
        )}
      </Box>

      {editRubro && (
        <Card sx={{ mt: 2, borderStyle: 'dashed' }}>
          <CardContent sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 2 }}>
            <TextField label="Nombre del rubro" value={editRubro.nombre} onChange={e => setEditRubro({ ...editRubro, nombre: e.target.value })} size="small" sx={{ flex: 1 }} />
            <Button variant="contained" onClick={saveRubro}>Guardar</Button>
            <Button variant="text" onClick={() => setEditRubro(null)}>Cancelar</Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
