'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ConstructionIcon from '@mui/icons-material/Construction';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12, animation: 'fadeIn 0.3s ease both' }}>
      <Card sx={{ maxWidth: 420, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ConstructionIcon sx={{ fontSize: 40, color: 'rgba(100,200,255,0.5)', mb: 1 }} />
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(150,200,255,0.5)' }}>
              Sistema de Certificados de Avance de Obra
            </Typography>
          </Box>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error" variant="standard">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 1 }}>
              Ingresar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
