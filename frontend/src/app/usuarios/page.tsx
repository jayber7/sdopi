'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
  id: number;
  email: string;
  nombre: string;
  role: string;
  activo: boolean;
  createdAt: string;
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
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include',
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ email: '', password: '', nombre: '', role: 'operador' });
      fetchUsers();
    } else {
      const err = await res.json().catch(() => ({ message: 'Error' }));
      setError(err.message || 'Error al crear usuario');
    }
  }

  async function toggleActivo(u: User) {
    if (u.id === user?.id) return;
    await fetch(`${API}/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
      credentials: 'include',
    });
    fetchUsers();
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Usuarios</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-slide-down">
          <div className="card-header">
            <h3 style={{ fontSize: '0.9375rem' }}>Nuevo Usuario</h3>
          </div>
          <form onSubmit={handleCreate} className="card-body grid gap-3 sm:grid-cols-2">
            {error && <div className="col-span-full banner banner-error">{error}</div>}
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input" required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
            <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" required minLength={6} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
              <option value="admin">Admin</option>
              <option value="operador">Operador</option>
              <option value="consulta">Consulta</option>
            </select>
            <button type="submit" className="col-span-full btn btn-success justify-center">Crear</button>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td style={{ color: 'var(--color-ink-muted)' }}>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td>
                  <span className={`badge ${u.activo ? 'badge-success' : 'badge-error'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleActivo(u)} disabled={u.id === user.id}
                    className="btn btn-ghost btn-xs" style={u.activo ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' }}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
