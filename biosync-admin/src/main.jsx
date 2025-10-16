import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const brandGradient = 'linear-gradient(135deg, #1c1400 0%, #d4a100 55%, #ffd913 100%)'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ffd913',
      light: '#ffeb75',
      dark: '#c7a300',
      contrastText: '#1a1400',
    },
    secondary: {
      main: '#ffefa3',
      contrastText: '#1a1400',
    },
    success: {
      main: '#c7a300',
    },
    text: {
      primary: '#1a1400',
      secondary: '#5c4a0c',
    },
    background: {
      default: '#fff9da',
      paper: '#ffffff',
    },
    divider: 'rgba(199,163,0,0.24)',
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fff9da',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,217,19,0.12), transparent 55%), radial-gradient(circle at 80% 0, rgba(199,163,0,0.16), transparent 35%)',
          color: '#1a1400',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundImage: brandGradient,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage:
            'linear-gradient(180deg, rgba(26,20,0,0.95) 0%, rgba(26,20,0,0.88) 65%, rgba(199,163,0,0.9) 100%)',
          color: '#fff1a6',
          borderRight: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          paddingLeft: 20,
          paddingRight: 20,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 10px 24px rgba(199,163,0,0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 18px 40px rgba(199,163,0,0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(245,247,250,1) 100%)',
          border: '1px solid rgba(199,163,0,0.12)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 38px rgba(199,163,0,0.16)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          marginBottom: 4,
          paddingLeft: 16,
          paddingRight: 14,
        },
      },
    },
  },
})

theme.palette.gradient = {
  primary: brandGradient,
  sidebar: 'linear-gradient(180deg, rgba(26,20,0,0.95) 0%, rgba(199,163,0,0.92) 60%, rgba(255,217,19,0.9) 100%)',
}

theme.customShadows = {
  card: '0 18px 40px rgba(199,163,0,0.12)',
  subtle: '0 10px 24px rgba(199,163,0,0.08)',
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
