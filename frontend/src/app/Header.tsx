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
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useState } from 'react';

const JEFATURA_LABEL: Record<Jefatura, string> = {
  DI: 'Infraestructura',
  UDETRA: 'Transporte',
  UEH: 'Energía',
  UPRADE: 'Prevención',
  UNASVI: 'Saneamiento',
};

const JEFATURAS: Jefatura[] = ['DI', 'UDETRA', 'UEH', 'UPRADE', 'UNASVI'];

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { jefatura: jefaturaActual, setJefatura } = useJefatura();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
              component="a"
              href="/dashboard"
              startIcon={<DashboardIcon />}
              sx={{ color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Dashboard
            </Button>
            <Button
              component="a"
              href="/"
              startIcon={<HomeIcon />}
              sx={{ color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Inicio
            </Button>
            <Button
              component="a"
              href="/proyectos"
              startIcon={<InventoryIcon />}
              sx={{ color: alpha(theme.palette.text.secondary, 0.6), '&:hover': { color: alpha(theme.palette.primary.light, 0.95) }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Proyectos
            </Button>
            {!loading && user && (
              <>
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
                    <MenuItem component="a" href="/admin" onClick={() => setAnchorEl(null)}>
                      <AdminPanelSettingsIcon sx={{ fontSize: 16, mr: 1 }} />
                      Panel Admin
                    </MenuItem>
                  )}
                  {can(user, 'usuarios', 'read') && (
                    <MenuItem component="a" href="/usuarios" onClick={() => setAnchorEl(null)}>
                      <PeopleIcon sx={{ fontSize: 16, mr: 1 }} />
                      Usuarios
                    </MenuItem>
                  )}
                  {can(user, 'roles', 'read') && (
                    <MenuItem component="a" href="/admin/roles" onClick={() => setAnchorEl(null)}>
                      <SecurityIcon sx={{ fontSize: 16, mr: 1 }} />
                      Roles
                    </MenuItem>
                  )}
                  {can(user, 'catalogo', 'read') && (
                    <MenuItem component="a" href="/admin/catalogo" onClick={() => setAnchorEl(null)}>
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
                component="a"
                href="/login"
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
