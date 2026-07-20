'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { can } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
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
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';

const API = '/api';

const RESOURCES = ['proyectos', 'planillas', 'evidencias', 'usuarios', 'roles', 'permisos', 'reportes', 'catalogo', 'dashboard'] as const;
const ACTIONS = ['read', 'create', 'update', 'delete', 'aprobar', 'verificar', 'generate'] as const;

interface Permission {
  id: number;
  resource: string;
  action: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: { permission: Permission }[];
  _count?: { users: number };
}

export default function AdminRolesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Role }>({ open: false });
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !can(user, 'roles', 'read')) { router.push('/'); return; }
    Promise.all([
      fetch(`${API}/roles`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/permisos`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
    ]).then(([r, p]) => { setRoles(r); setAllPerms(p); }).finally(() => setLoading(false));
  }, [user, router]);

  function openCreate() {
    setForm({ name: '', description: '' });
    setSelectedPerms(new Set());
    setDialog({ open: true });
  }

  function openEdit(role: Role) {
    setForm({ name: role.name, description: role.description ?? '' });
    setSelectedPerms(new Set(role.permissions.map(rp => rp.permission.id)));
    setDialog({ open: true, edit: role });
  }

  async function save() {
    setError(''); setBusy(true);
    if (!form.name.trim()) { setError('El nombre del rol es requerido'); setBusy(false); return; }
    try {
      const isEdit = dialog.edit;
      const url = isEdit ? `${API}/roles/${dialog.edit!.id}` : `${API}/roles`;
      const method = isEdit ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || undefined, permissionIds: [...selectedPerms] }),
        credentials: 'include',
      });
      if (!r.ok) { const err = await r.json().catch(() => ({ message: 'Error' })); throw new Error(err.message || 'Error'); }
      setDialog({ open: false });
      const fresh = await fetch(`${API}/roles`, { credentials: 'include' });
      if (fresh.ok) setRoles(await fresh.json());
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function deleteRole(role: Role) {
    if (!confirm(`¿Eliminar el rol "${role.name}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      const r = await fetch(`${API}/roles/${role.id}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) { const err = await r.json().catch(() => ({ message: 'Error' })); throw new Error(err.message); }
      const fresh = await fetch(`${API}/roles`, { credentials: 'include' });
      if (fresh.ok) setRoles(await fresh.json());
    } catch (e: any) { alert(e.message); }
  }

  function togglePerm(permId: number) {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  }

  function toggleResource(resource: string, checked: boolean) {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      for (const p of allPerms) {
        if (p.resource === resource) checked ? next.add(p.id) : next.delete(p.id);
      }
      return next;
    });
  }

  function resourceChecked(resource: string): boolean {
    const ids = allPerms.filter(p => p.resource === resource).map(p => p.id);
    return ids.length > 0 && ids.every(id => selectedPerms.has(id));
  }

  function resourceIndeterminate(resource: string): boolean {
    const ids = allPerms.filter(p => p.resource === resource).map(p => p.id);
    const checked = ids.filter(id => selectedPerms.has(id)).length;
    return checked > 0 && checked < ids.length;
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} sx={{ color: 'rgba(100,180,255,0.5)' }} /></Box>;
  if (!can(user, 'roles', 'read')) return null;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>
          Roles y Permisos
        </Typography>
        {can(user, 'roles', 'create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Rol</Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {roles.map(role => (
          <Card key={role.id}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem', textTransform: 'capitalize' }}>
                    {role.name}
                  </Typography>
                  {role.description && (
                    <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)', display: 'block', mt: 0.3 }}>
                      {role.description}
                    </Typography>
                  )}
                  {role._count && (
                    <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.35)', display: 'block', mt: 0.3 }}>
                      {role._count.users} usuario(s) asignado(s)
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {can(user, 'roles', 'update') && (
                    <Button size="small" startIcon={<EditIcon />} variant="text" onClick={() => openEdit(role)}>
                      Editar
                    </Button>
                  )}
                  {can(user, 'roles', 'delete') && role.name !== 'admin' && (
                    <Button size="small" startIcon={<DeleteIcon />} variant="text" color="error" onClick={() => deleteRole(role)}>
                      Eliminar
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {role.permissions.map(rp => (
                  <Chip key={rp.permission.id} label={`${rp.permission.resource}:${rp.permission.action}`} size="small"
                    sx={{ fontSize: '0.7rem', background: 'rgba(91,154,255,0.12)', color: 'rgba(150,200,255,0.7)' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
        {roles.length === 0 && (
          <Typography sx={{ color: 'rgba(150,200,255,0.4)', textAlign: 'center', py: 8 }}>No hay roles configurados.</Typography>
        )}
      </Box>

      <Dialog open={dialog.open} onClose={() => !busy && setDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.125rem' }}>
          {dialog.edit ? 'Editar Rol' : 'Nuevo Rol'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField label="Nombre del rol" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} size="small" sx={{ flex: 1 }} required disabled={busy} />
            <TextField label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} size="small" sx={{ flex: 1 }} disabled={busy} />
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(150,200,255,0.7)', mb: 1 }}>
            Permisos
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'rgba(150,200,255,0.5)', fontSize: '0.75rem' }}>Recurso</TableCell>
                {ACTIONS.map(a => (
                  <TableCell key={a} sx={{ fontWeight: 600, color: 'rgba(150,200,255,0.5)', fontSize: '0.7rem', textAlign: 'center', textTransform: 'uppercase' }}>{a}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {RESOURCES.map(resource => (
                <TableRow key={resource}>
                  <TableCell sx={{ textTransform: 'capitalize', fontSize: '0.8125rem' }}>
                    <Checkbox
                      checked={resourceChecked(resource)}
                      indeterminate={resourceIndeterminate(resource)}
                      onChange={(_, checked) => toggleResource(resource, checked)}
                      size="small"
                      disabled={busy}
                    />
                    {resource}
                  </TableCell>
                  {ACTIONS.map(action => {
                    const perm = allPerms.find(p => p.resource === resource && p.action === action);
                    const hasAction = !!perm;
                    return (
                      <TableCell key={action} sx={{ textAlign: 'center' }}>
                        {hasAction ? (
                          <Checkbox
                            checked={perm ? selectedPerms.has(perm.id) : false}
                            onChange={() => perm && togglePerm(perm.id)}
                            size="small"
                            disabled={busy}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.15)' }}>—</Typography>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false })} variant="outlined" disabled={busy}>Cancelar</Button>
          <Button onClick={save} variant="contained" disabled={busy}>{busy ? 'Guardando…' : dialog.edit ? 'Guardar Cambios' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
