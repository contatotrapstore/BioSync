import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { authService } from '@services/auth';
import ErrorBoundary from '@components/ErrorBoundary';
import { SnackbarProvider } from '@/contexts/SnackbarContext';
import theme from './theme';

// Lazy load pages for better performance
const Login = lazy(() => import('@pages/Login'));
const Register = lazy(() => import('@pages/Register'));
const GameLibrary = lazy(() => import('@pages/GameLibrary'));
const GameDetail = lazy(() => import('@pages/GameDetail'));
const GamePlay = lazy(() => import('@pages/GamePlay'));
const RenewPayment = lazy(() => import('@pages/RenewPayment'));

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const AUTH_TIMEOUT = 10000; // 10s timeout

    const checkAuth = async () => {
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, AUTH_TIMEOUT);

      try {
        const isAuth = await authService.isAuthenticated();

        clearTimeout(timeoutId);

        if (!controller.signal.aborted && isMounted) {
          setAuthenticated(isAuth);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Verificar se foi abortado por timeout
        if (error.name === 'AbortError') {
          console.warn('[App] Auth check timeout after 10s');
        } else {
          console.error('[App] Error checking authentication:', error);
        }

        if (!controller.signal.aborted && isMounted) {
          setAuthenticated(false);
        }
      } finally {
        clearTimeout(timeoutId);

        if (!controller.signal.aborted && isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      controller.abort(); // Cancelar qualquer operação pendente
    };
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,217,19,0.18), transparent 45%), radial-gradient(circle at 80% 10%, rgba(193,162,0,0.4), transparent 55%)'
        }}
      >
        <CircularProgress size={48} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <SnackbarProvider>
          <Router>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: 'background.default',
                backgroundImage:
                  'radial-gradient(circle at 0% 0%, rgba(255,217,19,0.06) 0%, transparent 45%), radial-gradient(circle at 95% 0%, rgba(102,230,185,0.04) 0%, transparent 40%)'
              }}
            >
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Suspense
                  fallback={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh'
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  }
                >
                  <Routes>
            <Route
              path="/login"
              element={
                authenticated ? (
                  <Navigate to="/library" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/register"
              element={
                authenticated ? (
                  <Navigate to="/library" replace />
                ) : (
                  <Register onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/library"
              element={
                authenticated ? (
                  <GameLibrary />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/game/:gameId"
              element={
                authenticated ? (
                  <GameDetail />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/game/:gameId/play"
              element={
                authenticated ? (
                  <GamePlay />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/renew-payment"
              element={
                authenticated ? (
                  <RenewPayment />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/"
              element={
                <Navigate to={authenticated ? '/library' : '/login'} replace />
              }
            />
          </Routes>
                </Suspense>
              </Box>
            </Box>
          </Router>
        </SnackbarProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
