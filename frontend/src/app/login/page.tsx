'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm animate-fade-in">
      <div className="card">
        <div className="card-header">
          <h3>Iniciar Sesión</h3>
        </div>
        <form onSubmit={handleSubmit} className="card-body space-y-4">
          {error && <div className="banner banner-error">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">Ingresar</button>
        </form>
      </div>
    </div>
  );
}
