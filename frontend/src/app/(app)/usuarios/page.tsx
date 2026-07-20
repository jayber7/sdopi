'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { can } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';

const API = '/api';
const RESOURCES = ['proyectos', 'planillas', 'evidencias', 'usuarios', 'roles', 'permisos', 'reportes', 'catalogo', 'dashboard'] as const;
const ACTIONS = ['read', 'create', 'update', 'delete', 'aprobar', 'verificar', 'generate'] as const;

interface Permission { id: number; resource: string; action: string; }
interface UserPerms { inherited: string[]; overrides: string[]; denied: string[]; }
interface User { id: number; email: string; nombre: string; role: string; activo: boolean; createdAt: string; }

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nombre: '', roleName: 'operador' });
  const [error, setError] = useState('');

  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', role: '' });

  const [permTarget, setPermTarget] = useState<number | null>(null);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [userPerms, setUserPerms] = useState<UserPerms | null>(null);
  const [selectedOverrides, setSelectedOverrides] = useState<Set<number>>(new Set());
  const [permBusy, setPermBusy] = useState(false);
  const [permError, setPermError] = useState('');

  useEffect(() => {
    if (user && !can(user, 'usuarios', 'read')) router.push('/');
    if (can(user, 'usuarios', 'read')) fetchUsers();
  }, [user, router]);

  async function fetchUsers() {
    const res = await fetch(`${API}/users`, { credentials: 'include' });
    if (res.ok) setUsers(await res.json());
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); setError('');
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form), credentials: 'include',
    });
    if (res.ok) {
      setShowForm(false); setForm({ email: '', password: '', nombre: '', roleName: 'operador' });
      fetchUsers();
    } else {
      const err = await res.json().catch(() => ({ message: 'Error' }));
      setError(err.message || 'Error al crear usuario');
    }
  }

  async function toggleActivo(u: User) {
    if (u.id === user?.id) return;
    await fetch(`${API}/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !u.activo }), credentials: 'include' });
    fetchUsers();
  }

  function openEdit(u: User) {
    setEditForm({ nombre: u.nombre, email: u.email, role: u.role });
    setEditTarget(u);
  }

  async function saveEdit() {
    if (!editTarget) return;
    await fetch(`${API}/users/${editTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm), credentials: 'include' });
    setEditTarget(null);
    fetchUsers();
  }

  async function openPermisos(u: User) {
    setPermTarget(u.id);
    setPermError('');
    setPermBusy(true);
    const [permsRes, userPermsRes] = await Promise.all([
      fetch(`${API}/permisos`, { credentials: 'include' }),
      fetch(`${API}/users/${u.id}/permisos`, { credentials: 'include' }),
    ]);
    if (permsRes.ok) setAllPerms(await permsRes.json());
    if (userPermsRes.ok) {
      const data: UserPerms = await userPermsRes.json();
      setUserPerms(data);
      const overrideIds = allPerms.filter(p => data.overrides.includes(`${p.resource}:${p.action}`)).map(p => p.id);
      setSelectedOverrides(new Set(overrideIds));
    }
    setPermBusy(false);
  }

  async function savePermisos() {
    if (!permTarget) return;
    setPermBusy(true);
    setPermError('');
    const res = await fetch(`${API}/users/${permTarget}/permisos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds: [...selectedOverrides] }),
      credentials: 'include',
    });
    if (res.ok) {
      setPermTarget(null);
    } else {
      const err = await res.json().catch(() => ({ message: 'Error' }));
      setPermError(err.message || 'Error');
    }
    setPermBusy(false);
  }

  function isOverride(perm: Permission) {
    return userPerms?.overrides.includes(`${perm.resource}:${perm.action}`) ?? false;
  }

  function isInherited(perm: Permission) {
    return userPerms?.inherited.includes(`${perm.resource}:${perm.action}`) ?? false;
  }

  function toggleOverride(perm: Permission) {
    setSelectedOverrides(prev => {
      const next = new Set(prev);
      next.has(perm.id) ? next.delete(perm.id) : next.add(perm.id);
      return next;
    });
  }

  function toggleResource(resource: string, checked: boolean) {
    setSelectedOverrides(prev => {
      const next = new Set(prev);
      for (const p of allPerms) {
        if (p.resource === resource) checked ? next.add(p.id) : next.delete(p.id);
      }
      return next;
    });
  }

  function resourceOverrideChecked(resource: string): boolean {
    const ids = allPerms.filter(p => p.resource === resource).map(p => p.id);
    return ids.length > 0 && ids.every(id => selectedOverrides.has(id));
  }

  function resourceOverrideIndeterminate(resource: string): boolean {
    const ids = allPerms.filter(p => p.resource === resource).map(p => p.id);
    const checked = ids.filter(id => selectedOverrides.has(id)).length;
    return checked > 0 && checked < ids.length;
  }

  if (!user || !can(user, 'usuarios', 'read')) return null;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>
          Usuarios
        </Typography>
        {can(user, 'usuarios', 'create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </Button>
        )}
      </Box>

      {showForm && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 2, fontSize: '0.9375rem' }}>
              Nuevo Usuario
            </Typography>
            <Box component="form" onSubmit={handleCreate} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
              <TextField label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} size="small" required />
              <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} size="small" required />
              <TextField label="Contraseña" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} size="small" required slotProps={{ htmlInput: { minLength: 6 } }} />
              <TextField select label="Rol" value={form.roleName} onChange={e => setForm({ ...form, roleName: e.target.value })} size="small">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="operador">Operador</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="consulta">Consulta</MenuItem>
              </TextField>
              <Button type="submit" variant="contained" color="success" sx={{ gridColumn: '1 / -1' }}>Crear</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nombre}</TableCell>
                  <TableCell sx={{ color: 'rgba(150,200,255,0.5)' }}>{u.email}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{u.role}</TableCell>
                  <TableCell>
                    <Chip label={u.activo ? 'Activo' : 'Inactivo'} color={u.activo ? 'success' : 'error'} size="small" variant="filled" />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {can(user, 'usuarios', 'update') && (
                        <Button onClick={() => openEdit(u)} size="small" variant="text" startIcon={<EditIcon />} sx={{ fontSize: '0.75rem', color: 'rgba(150,200,255,0.6)' }}>
                          Editar
                        </Button>
                      )}
                      {can(user, 'usuarios', 'update') && (
                        <Button onClick={() => openPermisos(u)} size="small" variant="text" startIcon={<SecurityIcon />} sx={{ fontSize: '0.75rem', color: 'rgba(150,200,255,0.6)' }}>
                          Permisos
                        </Button>
                      )}
                      <Button onClick={() => toggleActivo(u)} disabled={u.id === user.id} size="small" variant="text"
                        startIcon={u.activo ? <BlockIcon /> : <CheckCircleIcon />}
                        sx={{ color: u.activo ? 'rgba(255,107,107,0.7)' : 'rgba(0,219,180,0.7)', fontSize: '0.75rem' }}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.125rem' }}>
          Editar Usuario
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Nombre" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} size="small" fullWidth />
          <TextField label="Email" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} size="small" fullWidth />
          <TextField select label="Rol" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} size="small" fullWidth>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="operador">Operador</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
            <MenuItem value="consulta">Consulta</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} variant="outlined">Cancelar</Button>
          <Button onClick={saveEdit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Permisos dialog */}
      <Dialog open={!!permTarget} onClose={() => !permBusy && setPermTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.125rem' }}>
          Permisos del Usuario
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {permError && <Alert severity="error" sx={{ mb: 2 }}>{permError}</Alert>}
          {permBusy && !userPerms ? (
            <Typography sx={{ color: 'rgba(150,200,255,0.4)', textAlign: 'center', py: 4 }}>Cargando…</Typography>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)', display: 'block', mb: 2 }}>
                <Checkbox checked disabled size="small" sx={{ verticalAlign: 'middle' }} /> Heredado del rol &nbsp;&nbsp;
                <Checkbox checked size="small" sx={{ verticalAlign: 'middle', '& .MuiSvgIcon-root': { color: 'rgba(91,154,255,0.7)' } }} /> Override concedido
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
                          checked={resourceOverrideChecked(resource)}
                          indeterminate={resourceOverrideIndeterminate(resource)}
                          onChange={(_, checked) => toggleResource(resource, checked)}
                          size="small"
                        />
                        {resource}
                      </TableCell>
                      {ACTIONS.map(action => {
                        const perm = allPerms.find(p => p.resource === resource && p.action === action);
                        const inherited = perm ? isInherited(perm) : false;
                        const overridden = perm ? isOverride(perm) : false;
                        return (
                          <TableCell key={action} sx={{ textAlign: 'center' }}>
                            {perm ? (
                              <Checkbox
                                checked={overridden}
                                indeterminate={inherited && !overridden}
                                onChange={() => toggleOverride(perm)}
                                size="small"
                                disabled={permBusy}
                                sx={inherited && !overridden ? { '& .MuiSvgIcon-root': { color: 'rgba(150,200,255,0.25)' } } : { '& .MuiSvgIcon-root': { color: 'rgba(91,154,255,0.7)' } }}
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermTarget(null)} variant="outlined" disabled={permBusy}>Cancelar</Button>
          <Button onClick={savePermisos} variant="contained" disabled={permBusy || !userPerms}>
            {permBusy ? 'Guardando…' : 'Guardar Permisos'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
