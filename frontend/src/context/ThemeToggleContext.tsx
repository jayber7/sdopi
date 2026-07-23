'use client';
import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useJefatura } from './JefaturaContext';
import { useAuth } from '@/app/context/AuthContext';
import { buildTheme } from '@/theme/theme-jefatura';

export function ThemeToggleProvider({ children }: { children: React.ReactNode }) {
  const { jefatura } = useJefatura();
  const { user } = useAuth();
  const theme = useMemo(() => buildTheme(jefatura, user?.role), [jefatura, user?.role]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
