import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

const brandGradient = 'linear-gradient(120deg, #0a0d1a 0%, #0D1BA6 45%, #1E3DD9 100%)';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1E3DD9',
      light: '#4A6EF2',
      dark: '#0D1BA6',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#1d2536',
      light: '#273349',
      dark: '#101622'
    },
    background: {
      default: '#0a0d1a',
      paper: '#11141c'
    },
    text: {
      primary: '#e6eeff',
      secondary: '#8a97c4'
    },
    divider: 'rgba(74, 110, 242, 0.32)'
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
          backgroundColor: '#0a0d1a',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(30,61,217,0.18), transparent 45%), radial-gradient(circle at 80% 10%, rgba(13,27,166,0.6), transparent 55%)',
          color: '#e6eeff'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0d14',
          backgroundImage: brandGradient,
          boxShadow: '0 12px 32px rgba(10,13,26,0.6)'
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
          boxShadow: '0 10px 24px rgba(30,61,217,0.35)',
          '&:hover': {
            boxShadow: '0 16px 36px rgba(30,61,217,0.45)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(160deg, rgba(17,20,36,0.95) 0%, rgba(12,15,26,0.9) 100%)',
          border: '1px solid rgba(74, 110, 242, 0.18)',
          boxShadow: '0 16px 42px rgba(10, 13, 26, 0.55)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(150deg, rgba(16,19,32,0.96) 0%, rgba(10,13,26,0.95) 100%)',
          border: '1px solid rgba(74,110,242,0.1)'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(12,15,26,0.85)',
          '& fieldset': {
            borderColor: 'rgba(74, 110, 242, 0.35)'
          },
          '&:hover fieldset': {
            borderColor: 'rgba(74, 110, 242, 0.65)'
          },
          '&.Mui-focused fieldset': {
            borderColor: '#4A6EF2'
          }
        }
      }
    }
  }
});

(darkTheme).palette.gradient = {
  primary: brandGradient,
  secondary: 'linear-gradient(120deg, rgba(10,13,26,0.9) 0%, rgba(13,27,166,0.92) 60%, rgba(30,61,217,0.9) 100%)',
  card: 'linear-gradient(160deg, rgba(17,20,36,0.88) 0%, rgba(10,13,26,0.9) 100%)'
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
