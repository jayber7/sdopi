'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { municipios, type Municipio } from '@/lib/municipios';

interface Props {
  selected: Municipio;
}

interface Proyecto {
  id: number;
  nombre: string;
  contratista: string;
  provincia: string | null;
  municipio: string | null;
  montoModificado: number | null;
  activo: boolean;
}

export default function ProjectList({ selected }: Props) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('municipio', selected.nombre);
    setLoading(true);
    fetch(`/api/proyectos?${params}`)
      .then((r) => r.json())
      .then((data) => setProyectos(Array.isArray(data) ? data : []))
      .catch(() => setProyectos([]))
      .finally(() => setLoading(false));
  }, [selected.id]);

  return (
    <div className="card flex flex-col" style={{ minHeight: 0 }}>
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-gold)' }}>
          Proyectos
        </p>
      </div>
      <div className="flex-1 px-4 py-3 overflow-y-auto space-y-1.5">
        {loading ? (
          <p className="text-xs py-4 text-center" style={{ color: 'var(--color-ink-muted)' }}>Cargando...</p>
        ) : proyectos.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: 'var(--color-ink-muted)' }}>Sin proyectos</p>
        ) : (
          proyectos.map((p) => (
            <Link
              key={p.id}
              href={`/proyectos/${p.id}`}
              className="block p-2 rounded-lg transition-colors hover:bg-[var(--color-border-light)]"
              style={{ background: 'var(--color-border-light)' }}
            >
              <p className="text-xs font-medium truncate">{p.nombre}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>{p.contratista}</p>
              {p.montoModificado != null && (
                <p className="text-[11px] font-semibold mt-0.5">
                  Bs {p.montoModificado.toLocaleString('es-BO')}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
