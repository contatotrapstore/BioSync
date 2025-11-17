import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#CDA434',      // Dourado NeuroOne
      dark: '#8B6C42',
      light: '#E5C567',
      contrastText: '#111111',
    },
    secondary: {
      main: '#6A5840',      // Marrom suave
      light: '#8B7A66',
      dark: '#4A3F2F',
    },
    background: {
      default: '#FAF8F3',   // Bege claro
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6A5840',
      disabled: '#A39585',
    },
    success: {
      main: '#2E7D32',
      light: '#E6F4EA',
    },
    error: {
      main: '#D32F2F',
      light: '#FFEBEE',
    },
    warning: {
      main: '#ED6C02',
      light: '#FFF7E6',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 800,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,  // Cantos arredondados
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.08)',   // shadow-sm
    '0px 4px 8px rgba(0,0,0,0.12)',   // shadow-md
    '0px 8px 16px rgba(0,0,0,0.16)',  // shadow-lg
    '0px 12px 24px rgba(0,0,0,0.20)', // shadow-xl
    '0px 16px 32px rgba(0,0,0,0.24)', // shadow-2xl
    // Material-UI requer 25 níveis de sombra total
    '0px 1px 3px rgba(0,0,0,0.06)',
    '0px 3px 6px rgba(0,0,0,0.09)',
    '0px 5px 10px rgba(0,0,0,0.12)',
    '0px 7px 14px rgba(0,0,0,0.15)',
    '0px 9px 18px rgba(0,0,0,0.18)',
    '0px 11px 22px rgba(0,0,0,0.21)',
    '0px 13px 26px rgba(0,0,0,0.24)',
    '0px 15px 30px rgba(0,0,0,0.27)',
    '0px 17px 34px rgba(0,0,0,0.30)',
    '0px 19px 38px rgba(0,0,0,0.33)',
    '0px 21px 42px rgba(0,0,0,0.36)',
    '0px 23px 46px rgba(0,0,0,0.39)',
    '0px 25px 50px rgba(0,0,0,0.42)',
    '0px 27px 54px rgba(0,0,0,0.45)',
    '0px 29px 58px rgba(0,0,0,0.48)',
    '0px 31px 62px rgba(0,0,0,0.51)',
    '0px 33px 66px rgba(0,0,0,0.54)',
    '0px 35px 70px rgba(0,0,0,0.57)',
    '0px 37px 74px rgba(0,0,0,0.60)',
  ],
});
