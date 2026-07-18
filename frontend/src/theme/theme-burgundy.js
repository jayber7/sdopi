'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#960023',
      light: '#c03050',
      dark: '#6d0019',
    },
    secondary: {
      main: '#c9a84c',
      light: '#e0c66a',
      dark: '#a8882e',
    },
    background: {
      default: '#1a080d',
      paper: 'rgba(26,8,13,0.75)',
    },
    text: {
      primary: 'rgba(255,255,255,0.9)',
      secondary: 'rgba(200,180,160,0.6)',
    },
    divider: 'rgba(255,255,255,0.08)',
    action: {
      hover: 'rgba(150,0,35,0.15)',
      selected: 'rgba(150,0,35,0.2)',
      disabledBackground: 'rgba(255,255,255,0.05)',
    },
    info: { main: '#960023' },
    success: { main: '#2e7d5e', light: 'rgba(46,125,94,0.15)' },
    warning: { main: '#c9a84c', light: 'rgba(201,168,76,0.15)' },
    error: { main: '#d32f2f', light: 'rgba(211,47,47,0.15)' },
  },
  typography: {
    fontFamily: '"Sora", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: 'rgba(255,255,255,0.92)' },
    h5: { fontWeight: 600, color: 'rgba(255,255,255,0.92)' },
    h6: { fontWeight: 600, color: 'rgba(255,255,255,0.92)' },
    subtitle1: { color: 'rgba(255,255,255,0.85)' },
    body2: { color: 'rgba(255,255,255,0.75)' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #1a080d 0%, #2d0f16 40%, #1f0a10 70%, #1a080d 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.02)' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(26,8,13,0.9) 0%, rgba(45,15,22,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(192,48,80,0.2)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(26,8,13,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(192,48,80,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
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
          background: 'rgba(26,8,13,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(192,48,80,0.15)',
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
          background: 'linear-gradient(135deg, rgba(150,0,35,0.4) 0%, rgba(192,48,80,0.3) 100%)',
          border: '1px solid rgba(192,48,80,0.4)',
          boxShadow: '0 0 20px rgba(150,0,35,0.15)',
          color: 'rgba(255,220,200,0.95)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(150,0,35,0.6) 0%, rgba(192,48,80,0.45) 100%)',
            boxShadow: '0 0 30px rgba(150,0,35,0.25)',
          },
          '&.Mui-disabled': {
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.2)',
          },
        },
        outlined: {
          borderColor: 'rgba(201,168,76,0.3)',
          color: 'rgba(201,168,76,0.7)',
          '&:hover': {
            borderColor: 'rgba(201,168,76,0.5)',
            background: 'rgba(201,168,76,0.05)',
          },
        },
        text: {
          color: 'rgba(200,180,160,0.7)',
          '&:hover': {
            background: 'rgba(192,48,80,0.1)',
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
            '&:hover fieldset': { borderColor: 'rgba(192,48,80,0.3) !important' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(192,48,80,0.5) !important' },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(200,180,160,0.5)',
            '&.Mui-focused': { color: 'rgba(192,48,80,0.7)' },
          },
          '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
          '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: 'rgba(200,180,160,0.5)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.7rem',
        },
        filled: {
          '&.MuiChip-colorSuccess': {
            background: 'rgba(46,125,94,0.15)',
            color: '#2e7d5e',
          },
          '&.MuiChip-colorInfo': {
            background: 'rgba(192,48,80,0.15)',
            color: '#c03050',
          },
          '&.MuiChip-colorWarning': {
            background: 'rgba(201,168,76,0.15)',
            color: '#c9a84c',
          },
          '&.MuiChip-colorError': {
            background: 'rgba(211,47,47,0.15)',
            color: '#d32f2f',
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
      styleOverrides: {
        root: {
          background: 'transparent',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(200,180,160,0.7)',
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
            background: 'rgba(192,48,80,0.08) !important',
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
          '&:hover': { background: 'rgba(192,48,80,0.12)' },
          '&.Mui-selected': { background: 'rgba(192,48,80,0.18)' },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          background: 'transparent',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.06)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 4,
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          background: 'rgba(46,125,94,0.12)',
          color: 'rgba(46,125,94,0.9)',
          '& .MuiAlert-icon': { color: '#2e7d5e' },
        },
        standardWarning: {
          background: 'rgba(201,168,76,0.12)',
          color: 'rgba(201,168,76,0.9)',
          '& .MuiAlert-icon': { color: '#c9a84c' },
        },
        standardError: {
          background: 'rgba(211,47,47,0.1)',
          color: 'rgba(211,47,47,0.9)',
          '& .MuiAlert-icon': { color: '#d32f2f' },
        },
        standardInfo: {
          background: 'rgba(192,48,80,0.12)',
          color: 'rgba(192,48,80,0.9)',
          '& .MuiAlert-icon': { color: '#c03050' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(26,8,13,0.95)',
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
          background: 'rgba(26,8,13,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(192,48,80,0.12)',
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
            color: 'rgba(201,168,76,0.9)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: 'linear-gradient(90deg, #960023, #c9a84c)',
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
            borderColor: 'rgba(192,48,80,0.3) !important',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(192,48,80,0.5) !important',
          },
        },
      },
    },
  },
});

export default theme;
