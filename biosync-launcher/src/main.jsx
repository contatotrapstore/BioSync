import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

const brandGradient = 'linear-gradient(120deg, #0a1d14 0%, #103822 45%, #1f8a4c 100%)';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1f8a4c',
      light: '#37b464',
      dark: '#0d3f26',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#1d2a36',
      light: '#273a4a',
      dark: '#101922'
    },
    background: {
      default: '#070d0a',
      paper: '#111c17'
    },
    text: {
      primary: '#e6f3eb',
      secondary: '#8aa590'
    },
    divider: 'rgba(77, 108, 91, 0.32)'
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.04em'
    }
  },
  shape: {
    borderRadius: 14
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#070d0a',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(31,138,76,0.18), transparent 45%), radial-gradient(circle at 80% 10%, rgba(14,40,26,0.6), transparent 55%)',
          color: '#e6f3eb'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a1410',
          backgroundImage: brandGradient,
          boxShadow: '0 12px 32px rgba(2, 12, 7, 0.6)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          paddingLeft: 20,
          paddingRight: 20
        },
        contained: {
          boxShadow: '0 10px 24px rgba(31,138,76,0.35)',
          '&:hover': {
            boxShadow: '0 16px 36px rgba(31,138,76,0.45)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(160deg, rgba(18,28,23,0.95) 0%, rgba(12,22,17,0.9) 100%)',
          border: '1px solid rgba(55, 126, 86, 0.18)',
          boxShadow: '0 16px 42px rgba(4, 12, 8, 0.55)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(150deg, rgba(16,27,22,0.96) 0%, rgba(8,15,11,0.95) 100%)',
          border: '1px solid rgba(55,126,86,0.1)'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(12,22,18,0.85)',
          '& fieldset': {
            borderColor: 'rgba(77, 108, 91, 0.35)'
          },
          '&:hover fieldset': {
            borderColor: 'rgba(71, 214, 133, 0.65)'
          },
          '&.Mui-focused fieldset': {
            borderColor: '#37b464'
          }
        }
      }
    }
  }
});

(darkTheme).palette.gradient = {
  primary: brandGradient,
  secondary: 'linear-gradient(120deg, rgba(10,20,16,0.9) 0%, rgba(19,42,28,0.92) 60%, rgba(31,138,76,0.9) 100%)',
  card: 'linear-gradient(160deg, rgba(24,39,31,0.88) 0%, rgba(8,15,11,0.9) 100%)'
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
