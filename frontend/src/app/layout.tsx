import type { Metadata } from 'next';
import { DM_Serif_Display, Sora } from 'next/font/google';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AuthProvider } from './context/AuthContext';
import { ThemeToggleProvider } from '@/context/ThemeToggleContext';
import Header from './Header';

const serif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
});

const sans = Sora({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'GADOR - SDOP',
  description: 'Sistema de gestión de Certificados de Avance de Obra',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <ThemeToggleProvider>
            <AuthProvider>
              <Header />
              <main className="mx-auto w-full px-4 md:px-8 py-8 max-w-[1600px]">{children}</main>
            </AuthProvider>
          </ThemeToggleProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
