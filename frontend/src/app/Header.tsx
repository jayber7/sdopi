'use client';

import { useAuth } from './context/AuthContext';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import HomeIcon from '@mui/icons-material/Home';
import ConstructionIcon from '@mui/icons-material/Construction';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useState } from 'react';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Box sx={{ height: 3, background: 'linear-gradient(90deg, #5b9aff, #00dbb4, #ffb300)', flexShrink: 0 }} />
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConstructionIcon sx={{ color: 'rgba(100,200,255,0.6)', fontSize: 24 }} />
            <Typography
              variant="h6"
              component="a"
              href="/"
              sx={{
                fontFamily: 'var(--font-serif), Georgia, serif',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                color: 'rgba(150,220,255,0.95)',
                textDecoration: 'none',
                fontSize: '1.125rem',
              }}
            >
              CAO Gestión
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            <Button
              component="a"
              href="/"
              startIcon={<HomeIcon />}
              sx={{ color: 'rgba(150,200,255,0.6)', '&:hover': { color: 'rgba(150,220,255,0.95)' }, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
            >
              Inicio
            </Button>
            <Button
              component="a"
              href="/proyectos"
              startIcon={<InventoryIcon />}
              sx={{ color: 'rgba(150,200,255,0.6)', '&:hover': { color: 'rgba(150,220,255,0.95)' }, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
            >
              Proyectos
            </Button>
            {!loading && user && (
              <>
                {(user.role === 'admin' || user.role === 'operador') && (
                  <Button
                    component="a"
                    href="/admin/catalogo"
                    startIcon={<InventoryIcon />}
                    sx={{ color: 'rgba(150,200,255,0.6)', '&:hover': { color: 'rgba(150,220,255,0.95)' }, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
                  >
                    Catálogo
                  </Button>
                )}
                {user.role === 'admin' && (
                  <Button
                    component="a"
                    href="/usuarios"
                    startIcon={<PeopleIcon />}
                    sx={{ color: 'rgba(150,200,255,0.6)', '&:hover': { color: 'rgba(150,220,255,0.95)' }, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
                  >
                    Usuarios
                  </Button>
                )}
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{ ml: 1 }}
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
