'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
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
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API = '/api';

interface User {
  id: number; email: string; nombre: string; role: string;
  activo: boolean; createdAt: string;
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nombre: '', role: 'operador' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
    if (user?.role === 'admin') fetchUsers();
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
      setShowForm(false); setForm({ email: '', password: '', nombre: '', role: 'operador' });
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

  if (!user || user.role !== 'admin') return null;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>
          Usuarios
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </Button>
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
              <TextField select label="Rol" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} size="small">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="operador">Operador</MenuItem>
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
                    <Button
                      onClick={() => toggleActivo(u)}
                      disabled={u.id === user.id}
                      size="small"
                      variant="text"
                      startIcon={u.activo ? <BlockIcon /> : <CheckCircleIcon />}
                      sx={{ color: u.activo ? 'rgba(255,107,107,0.7)' : 'rgba(0,219,180,0.7)', fontSize: '0.75rem' }}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
