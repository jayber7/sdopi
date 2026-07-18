'use client';

import { useAuth } from './context/AuthContext';
import { can, hasAny } from '@/lib/permissions';
import { useThemeToggle } from '@/context/ThemeToggleContext';
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
import Tooltip from '@mui/material/Tooltip';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PaletteIcon from '@mui/icons-material/Palette';
import { useState } from 'react';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { mode, toggle } = useThemeToggle();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const hasAdminAccess = user && hasAny(user, 'usuarios:read', 'roles:read', 'catalogo:read');

  const gradientBar = mode === 'burgundy'
    ? 'linear-gradient(90deg, #960023, #c9a84c, #c03050)'
    : 'linear-gradient(90deg, #5b9aff, #00dbb4, #ffb300)';

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
              <Typography variant="body2" component="div" sx={{ lineHeight: 1.2, fontSize: { xs: '0.7rem', md: '0.8rem' }, color: 'rgba(150,200,255,0.65)' }}>
                Departamento de Oruro
              </Typography>
              <Typography variant="caption" component="div" sx={{ lineHeight: 1.2, fontSize: { xs: '0.6rem', md: '0.7rem' }, color: 'rgba(150,200,255,0.45)' }}>
                Secretaría Departamental de Obras Públicas
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>
            <Button
              component="a"
              href="/"
              startIcon={<HomeIcon />}
              sx={{ color: 'rgba(150,200,255,0.6)', '&:hover': { color: 'rgba(150,220,255,0.95)' }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Inicio
            </Button>
            <Button
              component="a"
              href="/proyectos"
              startIcon={<InventoryIcon />}
              sx={{ color: 'rgba(150,200,255,0.6)', '&:hover': { color: 'rgba(150,220,255,0.95)' }, fontSize: { xs: '0.7rem', md: '0.8125rem' }, minWidth: 0 }}
            >
              Proyectos
            </Button>
            <Tooltip title={mode === 'burgundy' ? 'Tema por defecto' : 'Tema burdeo'}>
              <IconButton onClick={toggle} size="small" sx={{ color: 'rgba(150,200,255,0.4)', '&:hover': { color: 'rgba(150,220,255,0.8)' } }}>
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!loading && user && (
              <>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{ ml: 0.5 }}
                >
                  <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(91,154,255,0.3)', color: 'rgba(150,220,255,0.9)', fontSize: '0.75rem', fontWeight: 600 }}>
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
                sx={{ borderColor: 'rgba(91,154,255,0.3)', color: 'rgba(150,200,255,0.7)', '&:hover': { borderColor: 'rgba(91,154,255,0.6)' } }}
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
