'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Jefatura = 'DI' | 'UDETRA' | 'UEH' | 'UPRADE' | 'UNASVI';

interface JefaturaCtx {
  jefatura: Jefatura;
  setJefatura: (j: Jefatura) => void;
}

const JefaturaContext = createContext<JefaturaCtx>({ jefatura: 'DI', setJefatura: () => {} });

const STORAGE_KEY = 'jefatura-actual';

export function JefaturaProvider({ children }: { children: ReactNode }) {
  const [jefatura, setJefaturaState] = useState<Jefatura>('DI');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Jefatura | null;
    if (saved && ['DI', 'UDETRA', 'UEH', 'UPRADE', 'UNASVI'].includes(saved)) {
      setJefaturaState(saved);
    }
  }, []);

  const setJefatura = useCallback((j: Jefatura) => {
    setJefaturaState(j);
    localStorage.setItem(STORAGE_KEY, j);
  }, []);

  return (
    <JefaturaContext.Provider value={{ jefatura, setJefatura }}>
      {children}
    </JefaturaContext.Provider>
  );
}

export function useJefatura() {
  return useContext(JefaturaContext);
}
