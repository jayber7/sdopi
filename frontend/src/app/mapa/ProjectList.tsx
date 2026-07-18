'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Municipio } from '@/lib/municipios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

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
    <Box className="glass-card" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box className="glass-header" sx={{ px: 2, py: 1.5 }}>
        <Typography className="glass-subtitle">Proyectos</Typography>
      </Box>
      <Box sx={{ flex: 1, px: 2, py: 1.5, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: 'rgba(100,180,255,0.5)' }} />
          </Box>
        ) : proyectos.length === 0 ? (
          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.4)', textAlign: 'center', display: 'block', py: 4 }}>
            Sin proyectos en {selected.nombre}
          </Typography>
        ) : (
          proyectos.map((p) => (
            <Link
              key={p.id}
              href={`/proyectos/${p.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.12s ease',
                  '&:hover': {
                    background: 'rgba(100,180,255,0.06)',
                    borderColor: 'rgba(100,180,255,0.12)',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(150,220,255,0.9)' }}>
                  {p.nombre}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>
                  {p.contratista}
                </Typography>
                {p.montoModificado != null && (
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.3, color: 'rgba(0,219,180,0.7)' }}>
                    Bs {p.montoModificado.toLocaleString('es-BO')}
                  </Typography>
                )}
              </Box>
            </Link>
          ))
        )}
      </Box>
    </Box>
  );
}
