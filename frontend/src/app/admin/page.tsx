'use client';

import { useAuth } from '../context/AuthContext';
import { can } from '@/lib/permissions';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';

const modules = [
  { key: 'usuarios', href: '/usuarios', icon: <PeopleIcon />, title: 'Usuarios', desc: 'Gestionar usuarios del sistema', perm: ['usuarios', 'read'] as const },
  { key: 'roles', href: '/admin/roles', icon: <SecurityIcon />, title: 'Roles y Permisos', desc: 'Configurar roles y matriz de permisos', perm: ['roles', 'read'] as const },
  { key: 'catalogo', href: '/admin/catalogo', icon: <InventoryIcon />, title: 'Catálogo de Rubros', desc: 'Administrar rubros e ítems del catálogo', perm: ['catalogo', 'read'] as const },
  { key: 'proyectos', href: '/proyectos', icon: <BusinessIcon />, title: 'Proyectos', desc: 'Listar, crear y administrar proyectos', perm: null },
];

function hasPerm(user: any, perm: readonly [string, string] | null) {
  return !perm || can(user, perm[0] as any, perm[1] as any);
}

export default function AdminPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, mb: 3 }}>
        Panel de Administración
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {modules.filter(m => hasPerm(user, m.perm)).map(m => (
          <Card key={m.key} sx={{ '&:hover': { boxShadow: '0 6px 30px rgba(0,0,0,0.35)' } }}>
            <CardActionArea component={Link} href={m.href} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                <Box sx={{ color: 'rgba(91,154,255,0.7)', display: 'flex' }}>{m.icon}</Box>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1rem' }}>{m.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(150,200,255,0.5)', mt: 0.3 }}>{m.desc}</Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
