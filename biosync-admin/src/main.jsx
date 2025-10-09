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

const brandGradient = 'linear-gradient(135deg, #0f2916 0%, #1f7a34 55%, #47b36b 100%)'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f7a34',
      light: '#4caf50',
      dark: '#0d3f1d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9be7a7',
      contrastText: '#0d2919',
    },
    success: {
      main: '#47b36b',
    },
    text: {
      primary: '#103021',
      secondary: '#4c6956',
    },
    background: {
      default: '#f1f6f3',
      paper: '#ffffff',
    },
    divider: 'rgba(16,48,33,0.12)',
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
          backgroundColor: '#f1f6f3',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(25,94,48,0.08), transparent 55%), radial-gradient(circle at 80% 0, rgba(71,179,107,0.12), transparent 35%)',
          color: '#103021',
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
            'linear-gradient(180deg, rgba(15,41,22,0.95) 0%, rgba(15,41,22,0.88) 65%, rgba(25,83,40,0.9) 100%)',
          color: '#ecf7ee',
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
            boxShadow: '0 10px 24px rgba(31,122,52,0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 18px 40px rgba(15,41,22,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(243,249,245,1) 100%)',
          border: '1px solid rgba(16,48,33,0.06)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 38px rgba(15,41,22,0.12)',
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
  sidebar: 'linear-gradient(180deg, rgba(11,33,19,0.95) 0%, rgba(25,83,40,0.92) 60%, rgba(40,117,60,0.9) 100%)',
}

theme.customShadows = {
  card: '0 18px 40px rgba(15,41,22,0.08)',
  subtle: '0 10px 24px rgba(15,41,22,0.06)',
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
