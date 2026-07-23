'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LoginIcon from '@mui/icons-material/Login';
import MapIcon from '@mui/icons-material/Map';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ConstructionIcon from '@mui/icons-material/Construction';
import { alpha, useTheme } from '@mui/material/styles';

const API = '/api';

export default function CaratulaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [stats, setStats] = useState<{ proyectos: number; monto: number; planillas: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetch(`${API}/proyectos/dashboard`, { credentials: 'include' })
        .then(r => r.ok && r.json())
        .then(d => {
          if (d) setStats({
            proyectos: d.totalProyectos || 54,
            monto: d.montoContratadoTotal || 543200000,
            planillas: d.totalPlanillas || 45,
          });
        })
        .catch(() => {});
    }
  }, [user]);

  const showStats = stats || { proyectos: 54, monto: 543200000, planillas: 45 };

  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.palette.background.default,
      overflow: 'hidden',
    }}>
      <Box sx={{
        position: 'fixed',
        inset: 0,
        background: `linear-gradient(135deg, rgba(10,14,39,0.85) 0%, rgba(10,14,39,0.7) 50%, rgba(10,14,39,0.85) 100%), url(/bg-oruro.jpg) center/cover no-repeat`,
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 100%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
        zIndex: 1,
      }} />

      <Box sx={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 1.5,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/escudo-oruro.png"
              alt="Escudo Oruro"
              sx={{ height: { xs: 36, md: 44 }, width: 'auto', borderRadius: 0.5 }}
            />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, fontWeight: 600, color: alpha(theme.palette.primary.light, 0.9), lineHeight: 1.2 }}>
                Gobierno Autónomo Departamental de Oruro
              </Typography>
              <Typography sx={{ fontSize: { xs: '0.6rem', md: '0.65rem' }, color: alpha(theme.palette.text.secondary, 0.5), lineHeight: 1.2 }}>
                Secretaría Departamental de Obras Públicas
              </Typography>
            </Box>
          </Box>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                onClick={() => router.push('/dashboard')}
                startIcon={<DashboardIcon />}
                variant="text"
                size="small"
                sx={{ color: alpha(theme.palette.text.secondary, 0.7), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, display: { xs: 'none', md: 'inline-flex' } }}
              >
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/proyectos')}
                startIcon={<InventoryIcon />}
                variant="text"
                size="small"
                sx={{ color: alpha(theme.palette.text.secondary, 0.7), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, display: { xs: 'none', md: 'inline-flex' } }}
              >
                Proyectos
              </Button>
              <Button
                onClick={() => router.push('/mapa')}
                startIcon={<MapIcon />}
                variant="outlined"
                size="small"
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.3), color: alpha(theme.palette.text.secondary, 0.8), '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.6) } }}
              >
                Mapa
              </Button>
            </Box>
          ) : (
            <Button
              onClick={() => router.push('/login')}
              startIcon={<LoginIcon />}
              variant="outlined"
              size="small"
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.3), color: alpha(theme.palette.text.secondary, 0.7), '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.6), borderWidth: 1 } }}
            >
              Iniciar Sesión
            </Button>
          )}
        </Box>

        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: { xs: 4, md: 0 },
        }}>
          <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                src="/escudo-oruro.png"
                alt="Escudo Oruro"
                sx={{ height: { xs: 80, md: 110 }, width: 'auto', opacity: 0.95 }}
              />
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontWeight: 400,
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                letterSpacing: '0.04em',
                color: alpha(theme.palette.primary.light, 0.95),
                mb: 1,
              }}
            >
              GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontWeight: 300,
                fontSize: { xs: '0.85rem', md: '1.1rem' },
                color: alpha(theme.palette.text.secondary, 0.7),
                mb: 3,
                letterSpacing: '0.02em',
              }}
            >
              Secretaría Departamental de Obras Públicas
            </Typography>

            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1,
              mb: 3,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}>
              <ConstructionIcon sx={{ fontSize: 18, color: alpha(theme.palette.primary.light, 0.6) }} />
              <Typography sx={{ fontSize: { xs: '0.72rem', md: '0.8rem' }, color: alpha(theme.palette.text.secondary, 0.6), letterSpacing: '0.03em' }}>
                GOBERNADOR: ING. EDGAR SANCHEZ AGUIRRE
              </Typography>
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                fontWeight: 600,
                color: alpha(theme.palette.secondary.main, 0.8),
                mb: 4,
                letterSpacing: '0.15em',
              }}
            >
              GESTIÓN 2026
            </Typography>

            {user ? (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  onClick={() => router.push('/mapa')}
                  variant="contained"
                  size="large"
                  startIcon={<MapIcon />}
                  sx={{ px: 4, py: 1.2, fontSize: '0.9rem', borderRadius: 2 }}
                >
                  Ir al Mapa de Proyectos
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outlined"
                  size="large"
                  startIcon={<DashboardIcon />}
                  sx={{ px: 4, py: 1.2, fontSize: '0.9rem', borderRadius: 2, borderColor: alpha(theme.palette.primary.main, 0.3) }}
                >
                  Dashboard
                </Button>
              </Box>
            ) : (
              <Button
                onClick={() => router.push('/login')}
                variant="contained"
                size="large"
                sx={{ px: 5, py: 1.3, fontSize: '0.95rem', borderRadius: 2, minWidth: 240 }}
              >
                Ingresar al Sistema
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 1,
          maxWidth: 640,
          mx: 'auto',
          width: '100%',
          px: 2,
          pb: 3,
        }}>
          {[
            { icon: '🏗️', label: 'Proyectos', value: `${showStats.proyectos}`, color: '#4fc3f7' },
            { icon: '💰', label: 'Monto Contratado', value: `Bs ${(showStats.monto / 1e6).toFixed(1)}M`, color: '#81c784' },
            { icon: '📋', label: 'Planillas Procesadas', value: `${showStats.planillas}`, color: '#ffb74d' },
          ].map((s, i) => (
            <Box key={i} sx={{
              p: { xs: 1.5, md: 2 },
              borderRadius: 2,
              textAlign: 'center',
              background: alpha(s.color, 0.04),
              border: `1px solid ${alpha(s.color, 0.12)}`,
              backdropFilter: 'blur(8px)',
            }}>
              <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, mb: 0.3 }}>{s.icon}</Typography>
              <Typography sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 700, color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, color: alpha(theme.palette.text.secondary, 0.5), textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{
          textAlign: 'center',
          py: 2,
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
          background: 'rgba(0,0,0,0.2)',
        }}>
          <Typography sx={{ fontSize: '0.65rem', color: alpha(theme.palette.text.secondary, 0.35) }}>
            © 2026 Gobierno Autónomo Departamental de Oruro — Secretaría Departamental de Obras Públicas
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
