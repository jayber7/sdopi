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
            {children}
          </AuthProvider>
        </ThemeToggleProvider>
      </JefaturaProvider>
    </AppRouterCacheProvider>
  );
}