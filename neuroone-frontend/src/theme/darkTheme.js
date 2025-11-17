import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#CDA434',      // Mesmo dourado
      dark: '#8B6C42',
      light: '#E5C567',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B7A66',      // Mais claro que no light
      light: '#A39585',
      dark: '#6A5840',
    },
    background: {
      default: '#0B0B0B',   // Preto profundo
      paper: '#1A1A1A',     // Cinza escuro
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A39585',
      disabled: '#6A5840',
    },
    success: {
      main: '#4CAF50',
      light: '#1B3A1C',     // Verde escuro para bg
    },
    error: {
      main: '#F44336',
      light: '#3A1C1B',     // Vermelho escuro para bg
    },
    warning: {
      main: '#FF9800',
      light: '#3A2E1B',     // Laranja escuro para bg
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
    '0px 2px 4px rgba(0,0,0,0.32)',   // Sombras mais intensas no dark
    '0px 4px 8px rgba(0,0,0,0.40)',
    '0px 8px 16px rgba(0,0,0,0.48)',
    '0px 12px 24px rgba(0,0,0,0.56)',
    '0px 16px 32px rgba(0,0,0,0.64)',
    '0px 1px 3px rgba(0,0,0,0.24)',
    '0px 3px 6px rgba(0,0,0,0.28)',
    '0px 5px 10px rgba(0,0,0,0.32)',
    '0px 7px 14px rgba(0,0,0,0.36)',
    '0px 9px 18px rgba(0,0,0,0.40)',
    '0px 11px 22px rgba(0,0,0,0.44)',
    '0px 13px 26px rgba(0,0,0,0.48)',
    '0px 15px 30px rgba(0,0,0,0.52)',
    '0px 17px 34px rgba(0,0,0,0.56)',
    '0px 19px 38px rgba(0,0,0,0.60)',
    '0px 21px 42px rgba(0,0,0,0.64)',
    '0px 23px 46px rgba(0,0,0,0.68)',
    '0px 25px 50px rgba(0,0,0,0.72)',
    '0px 27px 54px rgba(0,0,0,0.76)',
    '0px 29px 58px rgba(0,0,0,0.80)',
    '0px 31px 62px rgba(0,0,0,0.84)',
    '0px 33px 66px rgba(0,0,0,0.88)',
    '0px 35px 70px rgba(0,0,0,0.92)',
    '0px 37px 74px rgba(0,0,0,0.96)',
  ],
});
