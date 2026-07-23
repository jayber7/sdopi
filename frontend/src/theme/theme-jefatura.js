'use client';
import { createTheme, alpha } from '@mui/material/styles';

const CONFIG = {
  DI: {
    primary: { main: '#5b9aff', light: '#82b1ff', dark: '#3d7be8' },
    secondary: { main: '#ffb300', light: '#ffca28', dark: '#ff8f00' },
    background: { default: '#0a0e27', paper: 'rgba(10,14,39,0.75)' },
    textSecondary: 'rgba(150,200,255,0.6)',
    bodyGradient: 'linear-gradient(135deg, #0a0e27 0%, #1a1040 40%, #0d1b3e 70%, #0a0e27 100%)',
  },
  UDETRA: {
    primary: { main: '#e65100', light: '#ff6d00', dark: '#bf360c' },
    secondary: { main: '#ffb300', light: '#ffca28', dark: '#ff8f00' },
    background: { default: '#1a0e08', paper: 'rgba(26,14,8,0.75)' },
    textSecondary: 'rgba(255,200,150,0.6)',
    bodyGradient: 'linear-gradient(135deg, #1a0e08 0%, #2d1808 40%, #1a0e08 70%, #0d0704 100%)',
  },
  UEH: {
    primary: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
    secondary: { main: '#ffb300', light: '#ffca28', dark: '#ff8f00' },
    background: { default: '#081a0e', paper: 'rgba(8,26,14,0.75)' },
    textSecondary: 'rgba(150,220,180,0.6)',
    bodyGradient: 'linear-gradient(135deg, #081a0e 0%, #0f2d18 40%, #081a0e 70%, #040d07 100%)',
  },
  UPRADE: {
    primary: { main: '#7b1fa2', light: '#9c27b0', dark: '#6a1b9a' },
    secondary: { main: '#ffb300', light: '#ffca28', dark: '#ff8f00' },
    background: { default: '#14081a', paper: 'rgba(20,8,26,0.75)' },
    textSecondary: 'rgba(200,150,230,0.6)',
    bodyGradient: 'linear-gradient(135deg, #14081a 0%, #240d2d 40%, #14081a 70%, #0a040d 100%)',
  },
  UNASVI: {
    primary: { main: '#960023', light: '#c03050', dark: '#6d0019' },
    secondary: { main: '#c9a84c', light: '#e0c66a', dark: '#a8882e' },
    background: { default: '#1a080d', paper: 'rgba(26,8,13,0.75)' },
    textSecondary: 'rgba(200,180,160,0.6)',
    bodyGradient: 'linear-gradient(135deg, #1a080d 0%, #2d0a14 40%, #1a080d 70%, #0d0408 100%)',
  },
};

export function buildTheme(jefatura, role) {
  const c = CONFIG[jefatura] || CONFIG.DI;
  const isOperador = role === 'operador';

  const base = createTheme({
    palette: {
      mode: 'dark',
      primary: c.primary,
      secondary: c.secondary,
      background: c.background,
      text: { primary: 'rgba(255,255,255,0.9)', secondary: c.textSecondary },
      divider: 'rgba(255,255,255,0.08)',
      action: {
        hover: alpha(c.primary.main, 0.15),
        selected: alpha(c.primary.main, 0.20),
        disabledBackground: 'rgba(255,255,255,0.05)',
      },
      info: { main: c.primary.main },
      success: { main: '#00dbb4', light: 'rgba(0,219,180,0.15)' },
      warning: { main: '#ffb300', light: 'rgba(255,180,0,0.15)' },
      error: { main: '#ff6b6b', light: 'rgba(255,80,80,0.15)' },
    },
    typography: {
      fontFamily: '"Sora", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, color: 'rgba(255,255,255,0.92)' },
      h5: { fontWeight: 600, color: 'rgba(255,255,255,0.92)' },
      h6: { fontWeight: 600, color: 'rgba(255,255,255,0.92)' },
      subtitle1: { color: 'rgba(255,255,255,0.85)' },
      body2: { color: 'rgba(255,255,255,0.75)' },
    },
    shape: { borderRadius: 12 },
  });

  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isOperador
              ? `linear-gradient(180deg, rgba(0,219,180,0.07) 0%, transparent 20%), ${c.bodyGradient}`
              : c.bodyGradient,
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            ...(isOperador && { borderTop: '3px solid #00dbb4' }),
          },
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.02)' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: `linear-gradient(135deg, ${alpha(c.background.default, 0.9)} 0%, ${alpha(c.background.default, 0.9)} 100%)`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${alpha(c.primary.light, 0.15)}`,
            boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: alpha(c.background.default, 0.6),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(c.primary.light, 0.12)}`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.25)`,
            borderRadius: 12,
            '&:hover': {
              boxShadow: '0 6px 30px rgba(0,0,0,0.35)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: alpha(c.background.default, 0.92),
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${alpha(c.primary.light, 0.15)}`,
            boxShadow: '0 8px 60px rgba(0,0,0,0.6)',
            borderRadius: 16,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '8px 20px',
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${alpha(c.primary.main, 0.3)} 0%, ${alpha(c.primary.light, 0.2)} 100%)`,
            border: `1px solid ${alpha(c.primary.light, 0.3)}`,
            boxShadow: `0 0 20px ${alpha(c.primary.main, 0.08)}`,
            color: alpha(base.palette.text.primary, 0.95),
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(c.primary.main, 0.45)} 0%, ${alpha(c.primary.light, 0.35)} 100%)`,
              boxShadow: `0 0 30px ${alpha(c.primary.main, 0.15)}`,
            },
            '&.Mui-disabled': {
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.2)',
            },
          },
          outlined: {
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.05)',
            },
          },
          text: {
            color: alpha(c.textSecondary, 0.85),
            '&:hover': {
              background: alpha(c.primary.light, 0.1),
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              minHeight: '2.5em',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.85)',
              borderRadius: 8,
              '& fieldset': { border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
              '&:hover fieldset': { borderColor: `${alpha(c.primary.light, 0.35)} !important` },
              '&.Mui-focused fieldset': { borderColor: `${alpha(c.primary.light, 0.55)} !important` },
            },
            '& .MuiInputLabel-root': {
              color: alpha(c.textSecondary, 0.7),
              '&.Mui-focused': { color: alpha(c.primary.light, 0.8) },
            },
            '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
            '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: alpha(c.textSecondary, 0.7) },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.7rem' },
          filled: {
            '&.MuiChip-colorSuccess': {
              background: 'rgba(0,219,180,0.15)',
              color: '#00dbb4',
            },
            '&.MuiChip-colorInfo': {
              background: alpha(c.primary.main, 0.15),
              color: c.primary.main,
            },
            '&.MuiChip-colorWarning': {
              background: 'rgba(255,180,0,0.15)',
              color: '#ffb300',
            },
            '&.MuiChip-colorError': {
              background: 'rgba(255,80,80,0.15)',
              color: '#ff6b6b',
            },
            '&.MuiChip-colorDefault': {
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
            },
          },
          outlined: {
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)',
          },
        },
      },
      MuiTable: {
        styleOverrides: { root: { background: 'transparent' } },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              background: 'rgba(255,255,255,0.03)',
              color: alpha(c.textSecondary, 0.9),
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              background: `${alpha(c.primary.light, 0.06)} !important`,
            },
            '& .MuiTableCell-body': {
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.75)',
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: 'rgba(255,255,255,0.75)',
            '&:hover': { background: alpha(c.primary.light, 0.12) },
            '&.Mui-selected': { background: alpha(c.primary.light, 0.18) },
          },
        },
      },
      MuiList: {
        styleOverrides: { root: { background: 'transparent' } },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: 'rgba(255,255,255,0.06)' } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { background: 'rgba(255,255,255,0.05)', borderRadius: 4 },
          bar: { borderRadius: 4 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8 },
          standardSuccess: {
            background: 'rgba(0,219,180,0.12)',
            color: 'rgba(0,219,180,0.9)',
            '& .MuiAlert-icon': { color: '#00dbb4' },
          },
          standardWarning: {
            background: 'rgba(255,180,0,0.12)',
            color: 'rgba(255,200,0,0.9)',
            '& .MuiAlert-icon': { color: '#ffb300' },
          },
          standardError: {
            background: 'rgba(255,80,80,0.1)',
            color: 'rgba(255,100,100,0.9)',
            '& .MuiAlert-icon': { color: '#ff6b6b' },
          },
          standardInfo: {
            background: alpha(c.primary.main, 0.12),
            color: alpha(c.textSecondary, 0.9),
            '& .MuiAlert-icon': { color: c.primary.main },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            background: alpha(c.background.default, 0.95),
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.7rem',
            borderRadius: 6,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            background: alpha(c.background.default, 0.95),
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            borderRadius: 10,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            '&.Mui-selected': {
              color: alpha(base.palette.text.primary, 0.9),
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: `linear-gradient(90deg, ${c.primary.main}, ${c.secondary.main})`,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            color: 'rgba(255,255,255,0.85)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 8,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: `${alpha(c.primary.light, 0.35)} !important`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: `${alpha(c.primary.light, 0.55)} !important`,
            },
          },
        },
      },
    },
  });
}
