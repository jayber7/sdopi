'use client';

import { useAuth } from './context/AuthContext';
import { can, hasAny } from '@/lib/permissions';
import { useJefatura, type Jefatura } from '@/context/JefaturaContext';
import { useTheme, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import DashboardIcon from '@mui/icons-material/Dashboard';

import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import MapIcon from '@mui/icons-material/Map';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UndoIcon from '@mui/icons-material/Undo';
import SendIcon from '@mui/icons-material/Send';

const JEFATURA_LABEL: Record<Jefatura, string> = {
  DI: 'Infraestructura',
  UDETRA: 'Transporte',
  UEH: 'Energía',
  UPRADE: 'Prevención',
  UNASVI: 'Saneamiento',
};

const JEFATURAS: Jefatura[] = ['DI', 'UDETRA', 'UEH', 'UPRADE', 'UNASVI'];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === '/login' || pathname === '/') return null;

  const { user, loading, logout } = useAuth();
  const { jefatura: jefaturaActual, setJefatura } = useJefatura();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [pendientes, setPendientes] = useState<any[]>([]);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const r = await fetch('/api/notificaciones', { credentials: 'include' });
      if (r.ok) setNotificaciones(await r.json());
    } catch {}
  }, []);

  const fetchPendientes = useCallback(async () => {
    try {
      const r = await fetch('/api/planillas/pendientes', { credentials: 'include' });
      if (r.ok) setPendientes(await r.json());
    } catch {}
  }, []);

  const fetchAdminData = useCallback(() => {
    fetchNotificaciones();
    fetchPendientes();
  }, [fetchNotificaciones, fetchPendientes]);

  useEffect(() => {
    if (!user) return;
    fetchNotificaciones();
    let interval: ReturnType<typeof setInterval>;
    if (user.role === 'admin') {
      fetchAdminData();
      interval = setInterval(fetchAdminData, 30000);
    } else {
      interval = setInterval(fetchNotificaciones, 30000);
    }
    return () => clearInterval(interval);
  }, [user, fetchNotificaciones, fetchAdminData]);

  const totalNoLeidas = notificaciones.length;

  const hasAdminAccess = user && hasAny(user, 'usuarios:read', 'roles:read', 'catalogo:read');

  const gradientBar = `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.light})`;

  return (
    <>
      <Box sx={{ height: 3, background: gradientBar, flexShrink: 0 }} />
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1600, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Logo"
              sx={{ height: { xs: 36, md: 42 }, width: 'auto', borderRadius: 0.5 }}
            />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body1" component="div" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: { xs: '0.8rem', md: '0.875rem' }, color: 'rgba(255,255,255,0.92)' }}>
                Gobierno Autónomo
              </Typography>
              <Typography variant="body2" component="div" sx={{ lineHeight: 1.2, fontSize: { xs: '0.7rem', md: '0.8rem' }, color: alpha(theme.palette.text.secondary, 0.65) }}>
                Departamento de Oruro
              </Typography>
              <Typography variant="caption" component="div" sx={{ lineHeight: 1.2, fontSize: { xs: '0.6rem', md: '0.7rem' }, color: alpha(theme.palette.text.secondary, 0.45) }}>
                Secretaría Departamental de Obras Públicas
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {JEFATURAS.map((j) => {
              const active = j === jefaturaActual;
              return (
                <Button
                  key={j}
                  onClick={() => setJefatura(j)}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: active ? 700 : 500,
                    px: 1,
                    py: 0.25,
                    minWidth: 0,
                    borderRadius: 1,
                    color: active ? alpha(theme.palette.primary.light, 0.95) : alpha(theme.palette.text.secondary, 0.4),
                    background: active ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                    border: active ? `1px solid ${alpha(theme.palette.primary.main, 0.25)}` : '1px solid transparent',
                    textTransform: 'none',
                    transition: 'all 0.12s ease',
                    '&:hover': active ? {} : {
                      color: alpha(theme.palette.text.secondary, 0.7),
                      background: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  {JEFATURA_LABEL[j]}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>
            <Button
              onClick={() => router.push('/mapa')}
              startIcon={<MapIcon />}
              sx={{ color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Oruro
            </Button>
            <Button
              onClick={() => router.push('/proyectos')}
              startIcon={<InventoryIcon />}
              sx={{ color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Proyectos
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              startIcon={<DashboardIcon />}
              sx={{ color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Dashboard
            </Button>
            {!loading && user && (
              <>
                <IconButton onClick={async (e) => {
                    setNotifAnchor(e.currentTarget);
                    if (notificaciones.length) {
                      try { await fetch('/api/notificaciones/leer-todas', { method: 'PATCH', credentials: 'include' }); } catch {}
                      fetchNotificaciones();
                    }
                  }}
                  size="small" sx={{ mr: 0.5 }}>
                  <Badge badgeContent={totalNoLeidas} color="error" invisible={totalNoLeidas === 0}>
                    <NotificationsIcon sx={{ fontSize: 20, color: alpha(theme.palette.text.secondary, 0.5) }} />
                  </Badge>
                </IconButton>
                <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { sx: { maxHeight: 360, width: 360 } } }}>
                  {notificaciones.length === 0 ? (
                    <MenuItem disabled sx={{ fontSize: '0.8125rem', opacity: 0.5 }}>Sin notificaciones</MenuItem>
                  ) : notificaciones.map(n => {
                    const iconMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
                      planilla_enviada: { icon: <SendIcon sx={{ fontSize: 16 }} />, color: '#4fc3f7', label: 'Planilla enviada' },
                      planilla_aprobada: { icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, color: '#66bb6a', label: 'Planilla aprobada' },
                      planilla_devuelta: { icon: <UndoIcon sx={{ fontSize: 16 }} />, color: '#ffa726', label: 'Devuelta a borrador' },
                      item_rechazado: { icon: <CancelIcon sx={{ fontSize: 16 }} />, color: '#ef5350', label: 'Ítem rechazado' },
                    };
                    const cfg = iconMap[n.tipo] || { icon: <NotificationsIcon sx={{ fontSize: 16 }} />, color: '#aaa', label: 'Notificación' };
                    return (
                      <MenuItem key={n.id} onClick={() => { setNotifAnchor(null); router.push(`/proyectos/${n.proyectoId}`); }}
                        sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.25, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: cfg.color }}>{cfg.label}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(180,180,180,0.7)', ml: 3.5 }}>{n.mensaje}</Typography>
                      </MenuItem>
                    );
                  })}
                </Menu>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{ ml: 0.5 }}
                >
                  <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.primary.main, 0.3), color: alpha(theme.palette.primary.light, 0.9), fontSize: '0.75rem', fontWeight: 600 }}>
                    {user.nombre.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  {hasAdminAccess && (
                    <MenuItem onClick={() => { setAnchorEl(null); router.push('/admin'); }}>
                      <AdminPanelSettingsIcon sx={{ fontSize: 16, mr: 1 }} />
                      Panel Admin
                    </MenuItem>
                  )}
                  {can(user, 'usuarios', 'read') && (
                    <MenuItem onClick={() => { setAnchorEl(null); router.push('/usuarios'); }}>
                      <PeopleIcon sx={{ fontSize: 16, mr: 1 }} />
                      Usuarios
                    </MenuItem>
                  )}
                  {can(user, 'roles', 'read') && (
                    <MenuItem onClick={() => { setAnchorEl(null); router.push('/admin/roles'); }}>
                      <SecurityIcon sx={{ fontSize: 16, mr: 1 }} />
                      Roles
                    </MenuItem>
                  )}
                  {can(user, 'catalogo', 'read') && (
                    <MenuItem onClick={() => { setAnchorEl(null); router.push('/admin/catalogo'); }}>
                      <InventoryIcon sx={{ fontSize: 16, mr: 1 }} />
                      Catálogo
                    </MenuItem>
                  )}
                  <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
                  <MenuItem disabled sx={{ fontSize: '0.75rem', opacity: 0.6 }}>{user.nombre}</MenuItem>
                  <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
                    <LogoutIcon sx={{ fontSize: 16, mr: 1 }} />
                    Salir
                  </MenuItem>
                </Menu>
              </>
            )}
            {!loading && !user && (
              <Button
                onClick={() => router.push('/login')}
                startIcon={<LoginIcon />}
                variant="outlined"
                size="small"
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.3), color: alpha(theme.palette.text.secondary, 0.7), '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.6) } }}
              >
                Ingresar
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
