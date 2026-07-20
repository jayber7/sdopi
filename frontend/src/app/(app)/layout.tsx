import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AuthProvider } from '@/app/context/AuthContext';
import { ThemeToggleProvider } from '@/context/ThemeToggleContext';
import { JefaturaProvider } from '@/context/JefaturaContext';
import Header from '@/app/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <JefaturaProvider>
        <ThemeToggleProvider>
          <AuthProvider>
            <Header />
            <main className="mx-auto w-full px-4 md:px-8 py-8 max-w-[1600px]">{children}</main>
          </AuthProvider>
        </ThemeToggleProvider>
      </JefaturaProvider>
    </AppRouterCacheProvider>
  );
}