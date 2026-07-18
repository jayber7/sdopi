'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { can, type Resource, type Action } from '@/lib/permissions';

export interface User {
  id: number;
  email: string;
  nombre: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (resource: Resource, action: Action) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((u: User) => {
    setUser({ ...u, permissions: u.permissions ?? [] });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetch(`${API}/auth/me`, { credentials: 'include', signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => { if (u) syncUser(u); else setUser(null); })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [syncUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al iniciar sesion' }));
      throw new Error(err.message || 'Error al iniciar sesion');
    }
    const u = await res.json();
    syncUser(u);
  }, [syncUser]);

  const logout = useCallback(async () => {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    window.location.href = '/login';
  }, []);

  const canUser = useCallback((resource: Resource, action: Action) => can(user, resource, action), [user]);

  const refreshPermissions = useCallback(async () => {
    const res = await fetch(`${API}/auth/refresh-permissions`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setUser(prev => prev ? { ...prev, permissions: data.permissions } : null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can: canUser, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
