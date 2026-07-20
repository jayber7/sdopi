'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Municipio } from '@/lib/municipios';
import { useJefatura } from '@/context/JefaturaContext';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
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
  montoContrato: number;
  activo: boolean;
  avanceFisico: number;
  avanceFinanciero: number;
}

export default function ProjectList({ selected }: Props) {
  const theme = useTheme();
  const { jefatura: jefaturaActual } = useJefatura();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(`/api/proyectos?municipio=${encodeURIComponent(selected.nombre)}&jefatura=${jefaturaActual}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => setProyectos(Array.isArray(data) ? data : []))
      .catch(() => setProyectos([]))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [selected.id, jefaturaActual]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: theme.palette.background.paper, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
      <Box className="glass-header" sx={{ px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: alpha(theme.palette.text.secondary, 0.7) }}>Proyectos</Typography>
      </Box>
      <Box sx={{ flex: 1, px: 2, py: 1.5, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: alpha(theme.palette.primary.main, 0.5) }} />
          </Box>
        ) : proyectos.length === 0 ? (
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6), textAlign: 'center', display: 'block', py: 4 }}>
            Sin proyectos en {selected.nombre}
          </Typography>
        ) : (
          proyectos.map((p) => {
            const fisico = p.avanceFisico * 100;
            const financiero = p.avanceFinanciero * 100;
            return (
              <Link key={p.id} href={`/proyectos/${p.id}`} style={{ textDecoration: 'none' }}>
                <Box sx={{ p: 1.5, mb: 1, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.12s ease', '&:hover': { background: alpha(theme.palette.primary.main, 0.06), borderColor: alpha(theme.palette.primary.main, 0.12) } }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: alpha(theme.palette.primary.light, 0.9) }}>
                    {p.nombre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>{p.contratista}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.8 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: alpha(theme.palette.success.main, 0.8), fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Físico</span><span>{Math.round(fisico)}%</span>
                      </Typography>
                      <LinearProgress variant="determinate" value={Math.min(fisico, 100)} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.15), '& .MuiLinearProgress-bar': { bgcolor: fisico > 80 ? theme.palette.success.main : fisico > 40 ? theme.palette.warning.main : theme.palette.error.main, borderRadius: 2 } }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: alpha(theme.palette.primary.main, 0.8), fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Financiero</span><span>{Math.round(financiero)}%</span>
                      </Typography>
                      <LinearProgress variant="determinate" value={Math.min(financiero, 100)} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.15), '& .MuiLinearProgress-bar': { bgcolor: theme.palette.primary.main, borderRadius: 2 } }} />
                    </Box>
                  </Box>
                </Box>
              </Link>
            );
          })
        )}
      </Box>
    </Box>
  );
}
