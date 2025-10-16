import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import GameLibrary from './pages/GameLibrary';
import GameDetail from './pages/GameDetail';
import RenewPayment from './pages/RenewPayment';
import Header from './components/Header';
import PaymentAlert from './components/PaymentAlert';
import ContentUpdateDialog from './components/ContentUpdateDialog';
import { isAuthenticated } from './utils/auth';
import contentUpdater from './services/contentUpdater';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showContentUpdate, setShowContentUpdate] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      // Verificar atualizações de conteúdo após login
      checkContentUpdates();

      // Iniciar verificação periódica (a cada 30 minutos)
      contentUpdater.startPeriodicCheck(30);

      return () => {
        contentUpdater.stopPeriodicCheck();
      };
    }
  }, [authenticated]);

  const checkAuth = async () => {
    try {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);
    } catch (error) {
      console.error('[App] Error checking authentication:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const checkContentUpdates = async () => {
    try {
      // Verificar e baixar automaticamente jogos novos
      const result = await contentUpdater.checkAndDownloadNewGames({
        autoDownload: true,  // Download automático
        showProgress: true
      });

      if (result.hasNewGames) {
        console.log(`[App] ${result.downloadedCount} jogos novos foram baixados automaticamente`);

        // Se houver jogos novos, mostrar notificação (opcional)
        if (result.downloadedCount > 0) {
          setShowContentUpdate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/baixar atualizações de conteúdo:', error);
    }
  };

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
          bgcolor: 'background.default'
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {authenticated && <Header onLogout={handleLogout} />}
        {authenticated && <PaymentAlert />}
        {authenticated && (
          <ContentUpdateDialog
            open={showContentUpdate}
            onClose={() => setShowContentUpdate(false)}
          />
        )}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
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
              path="/game/:id"
              element={
                authenticated ? (
                  <GameDetail />
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
        </Box>
      </Box>
    </Router>
  );
}

export default App;

