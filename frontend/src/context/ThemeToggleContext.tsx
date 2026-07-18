'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import themeDefault from '@/theme/theme';
import themeBurgundy from '@/theme/theme-burgundy';

type ThemeMode = 'default' | 'burgundy';

interface ThemeCtx {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeToggleContext = createContext<ThemeCtx>({ mode: 'default', toggle: () => {} });

export function ThemeToggleProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('default');

  useEffect(() => {
    const saved = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (saved === 'burgundy' || saved === 'default') setMode(saved);
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'default' ? 'burgundy' : 'default';
      localStorage.setItem('theme-mode', next);
      return next;
    });
  }, []);

  const theme = mode === 'burgundy' ? themeBurgundy : themeDefault;

  return (
    <ThemeToggleContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}

export function useThemeToggle() {
  return useContext(ThemeToggleContext);
}
