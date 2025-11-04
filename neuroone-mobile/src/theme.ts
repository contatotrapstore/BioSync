import { alpha, createTheme } from '@mui/material/styles';

const primaryMain = '#FFD913';
const surface = 'rgba(15, 18, 32, 0.92)';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: primaryMain
    },
    secondary: {
      main: '#66E6B9'
    },
    background: {
      default: '#05070F',
      paper: surface
    },
    error: {
      main: '#FF5073'
    },
    warning: {
      main: '#FFB347'
    },
    success: {
      main: '#66E6B9'
    },
    text: {
      primary: '#F8F9FF',
      secondary: alpha('#F8F9FF', 0.72)
    }
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 600
    },
    h4: {
      fontWeight: 600
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    subtitle1: {
      color: alpha('#F8F9FF', 0.82)
    },
    body2: {
      color: alpha('#F8F9FF', 0.72)
    }
  },
  shape: {
    borderRadius: 18
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: surface,
          borderRadius: 20,
          border: `1px solid ${alpha('#FFFFFF', 0.06)}`
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: surface,
          borderRadius: 22,
          border: `1px solid ${alpha('#FFFFFF', 0.04)}`
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 14
        },
        containedPrimary: {
          color: '#05070F',
          boxShadow: '0 12px 30px rgba(255, 217, 19, 0.2)'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#FFFFFF', 0.04),
          borderRadius: 14
        }
      }
    }
  }
});

export default theme;
