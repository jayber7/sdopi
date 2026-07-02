'use client';

import { useAuth } from './context/AuthContext';

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <>
      <div className="gov-bar" />
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="text-xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
            CAO Gestión
          </a>
          <nav className="flex items-center gap-6 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            <a href="/" className="hover:text-[var(--color-primary)] transition-colors">Inicio</a>
            <a href="/proyectos" className="hover:text-[var(--color-primary)] transition-colors">Proyectos</a>
            {!loading && user && (
              <>
                {(user.role === 'admin' || user.role === 'operador') && <a href="/admin/catalogo" className="hover:text-[var(--color-primary)] transition-colors">Catálogo</a>}
                {user.role === 'admin' && <a href="/usuarios" className="hover:text-[var(--color-primary)] transition-colors">Usuarios</a>}
                <span className="text-[var(--color-ink-faint)] text-xs">{user.nombre}</span>
                <button onClick={logout} className="hover:text-[var(--color-error)] transition-colors text-xs font-medium">Salir</button>
              </>
            )}
            {!loading && !user && (
              <a href="/login" className="text-[var(--color-accent)] hover:text-[#a63a2e] transition-colors font-medium">Ingresar</a>
            )}
          </nav>
        </div>
        <div className="border-t border-[var(--color-border-light)] px-6 py-1.5 text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>
          Gobierno Autónomo Departamental de Oruro · Secretaría Departamental de Obras Públicas · Dirección de Infraestructura
        </div>
      </header>
    </>
  );
}
