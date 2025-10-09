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

const brandGradient = 'linear-gradient(135deg, #0d1f3d 0%, #1565c0 55%, #42a5f5 100%)'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
      light: '#42a5f5',
      dark: '#0d1f3d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#90caf9',
      contrastText: '#0d1f3d',
    },
    success: {
      main: '#42a5f5',
    },
    text: {
      primary: '#0d1f3d',
      secondary: '#455a64',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    divider: 'rgba(13,31,61,0.12)',
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
          backgroundColor: '#f5f7fa',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(13,31,61,0.08), transparent 55%), radial-gradient(circle at 80% 0, rgba(21,101,192,0.12), transparent 35%)',
          color: '#0d1f3d',
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
            'linear-gradient(180deg, rgba(13,31,61,0.95) 0%, rgba(13,31,61,0.88) 65%, rgba(21,101,192,0.9) 100%)',
          color: '#e3f2fd',
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
            boxShadow: '0 10px 24px rgba(21,101,192,0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 18px 40px rgba(13,31,61,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(245,247,250,1) 100%)',
          border: '1px solid rgba(13,31,61,0.06)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 38px rgba(13,31,61,0.12)',
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
  sidebar: 'linear-gradient(180deg, rgba(13,31,61,0.95) 0%, rgba(21,101,192,0.92) 60%, rgba(66,165,245,0.9) 100%)',
}

theme.customShadows = {
  card: '0 18px 40px rgba(13,31,61,0.08)',
  subtle: '0 10px 24px rgba(13,31,61,0.06)',
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
