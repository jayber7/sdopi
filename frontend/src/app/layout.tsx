import type { Metadata } from 'next';
import { DM_Serif_Display, Sora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
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
  title: 'CAO Gestión',
  description: 'Sistema de gestión de Certificados de Avance de Obra',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
