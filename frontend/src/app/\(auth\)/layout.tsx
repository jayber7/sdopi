'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AuthProvider } from '@/app/context/AuthContext';
import { ThemeToggleProvider } from '@/context/ThemeToggleContext';
import { JefaturaProvider } from '@/context/JefaturaContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <JefaturaProvider>
        <ThemeToggleProvider>
          <AuthProvider>
            <main className="mx-auto w-full px-4 md:px-8 py-8 max-w-[1600px]">
              {children}
            </main>
          </AuthProvider>
        </ThemeToggleProvider>
      </JefaturaProvider>
    </AppRouterCacheProvider>
  );
}