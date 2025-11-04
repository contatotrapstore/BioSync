import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Alert,
  Badge,
  Box,
  Chip,
  Container,
  Drawer,
  Fab,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountCircle as ProfileIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Game } from '@/types';
import { apiService } from '@services/api';
import { authService } from '@services/auth';
import { contentUpdater } from '@services/contentUpdater';
import GameCard from '@components/GameCard';
import DownloadProgress from '@components/DownloadProgress';
import PaymentAlert from '@components/PaymentAlert';
import { useExitConfirmation } from '@hooks/useBackButton';
import { useDownload } from '@hooks/useDownload';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import logoImg from '@/assets/logo.png';

/**
 * Página principal da biblioteca de jogos
 */

export const GameLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { downloadState, downloadGame, resetDownload } = useDownload();

  // Back button com confirmação de saída
  useExitConfirmation();

  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeDownloads, setActiveDownloads] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    loadGames();
    loadUser();
  }, []);

  useEffect(() => {
    filterGames();
  }, [searchQuery, games]);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getGames();
      const gamesData = response.games ?? [];

      setGames(gamesData);
      setFilteredGames(gamesData);
    } catch (err: any) {
      console.error('[GameLibrary] Error loading games:', err);
      setError('Erro ao carregar jogos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('[GameLibrary] Error loading user:', error);
    }
  };

  const filterGames = () => {
    if (!searchQuery.trim()) {
      setFilteredGames(games);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = games.filter((game) => {
      const title = (game.title || game.name || '').toLowerCase();
      const description = (game.description || '').toLowerCase();
      const category = typeof game.category === 'string' ? game.category.toLowerCase() : '';

      return (
        title.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });

    setFilteredGames(filtered);
  };

  const handleDownload = async (game: Game) => {
    try {
      setActiveDownloads((prev) => prev + 1);
      const success = await downloadGame(game);

      if (success) {
        // Atualizar lista de jogos para mostrar como instalado
        await loadGames();
      }
    } catch (error) {
      console.error('[GameLibrary] Download error:', error);
    } finally {
      setActiveDownloads((prev) => prev - 1);
      setTimeout(resetDownload, 2000); // Limpar estado após 2s
    }
  };

  const handlePlay = (game: Game) => {
    navigate(`/game/${game.id}/play`);
  };

  const handleDelete = async (game: Game) => {
    try {
      await contentUpdater.uninstallGame(game.id);
      await loadGames(); // Recarregar lista
    } catch (error) {
      console.error('[GameLibrary] Delete error:', error);
      alert('Erro ao desinstalar jogo');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('[GameLibrary] Logout error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impact({ style: ImpactStyle.Light });

    try {
      await Promise.all([loadGames(), loadUser()]);
    } catch (error) {
      console.error('[GameLibrary] Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'NeuroExplorer';

  return (
    <Box
      sx={{
        pb: 10,
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 0% -10%, rgba(255,217,19,0.18) 0%, rgba(5,7,15,0.92) 55%), radial-gradient(circle at 110% 0%, rgba(102,230,185,0.16) 0%, rgba(5,7,15,0.95) 60%)'
      }}
    >
      {/* App Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(8,12,24,0.85)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <Toolbar>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box
              component="img"
              src={logoImg}
              alt="Logo NeuroOne"
              sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              NeuroOne Launcher
            </Typography>
          </Stack>
          <IconButton
            onClick={() => setShowProfile(true)}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' }
            }}
          >
            <ProfileIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Payment Alert */}
        <PaymentAlert />

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 3.5,
            px: { xs: 3, sm: 4 },
            py: { xs: 3, sm: 3.5 },
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.05)',
            background:
              'linear-gradient(135deg, rgba(18,22,38,0.88) 0%, rgba(10,13,26,0.72) 100%)'
          }}
        >
          <Stack spacing={2.5}>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Bem-vindo de volta, {firstName}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Biblioteca de neurogames
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerencie sessões, downloads e evolução clínica em um só lugar.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`${filteredGames.length} ${filteredGames.length === 1 ? 'jogo disponível' : 'jogos disponíveis'}`}
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              <Chip
                label={
                  user
                    ? user.hasActiveSubscription
                      ? 'Assinatura ativa'
                      : 'Assinatura inativa'
                    : 'Sincronizando assinatura'
                }
                color={user?.hasActiveSubscription ? 'success' : 'warning'}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Busca */}
        <TextField
          fullWidth
          placeholder="Buscar jogos por nome, categoria ou objetivo"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: {
              px: 1,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.08)'
              }
            }
          }}
          sx={{ mb: 3 }}
        />

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Download Progress */}
        {downloadState.isDownloading && downloadState.progress && (
          <Box sx={{ mb: 3 }}>
            <DownloadProgress
              progress={downloadState.progress}
              gameName={(() => {
                const progressGame = games.find((g) => g.id === downloadState.progress?.gameId);
                return progressGame ? (progressGame.title || progressGame.name || 'Jogo') : undefined;
              })()}
              showControls={false}
            />
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && filteredGames.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {searchQuery ? 'Nenhum jogo encontrado' : 'Nenhum jogo disponível'}
            </Typography>
          </Box>
        )}

        {/* Game Grid */}
        {!loading && filteredGames.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              gap: 2.5
            }}
          >
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onDownload={handleDownload}
                onPlay={handlePlay}
                onDelete={handleDelete}
              />
            ))}
          </Box>
        )}
      </Container>

      {/* Refresh FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          boxShadow: '0 18px 35px rgba(255,217,19,0.25)'
        }}
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <Badge badgeContent={activeDownloads} color="error">
          <RefreshIcon />
        </Badge>
      </Fab>

      {/* Profile Drawer */}
      <Drawer
        anchor="right"
        open={showProfile}
        onClose={() => setShowProfile(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Perfil
          </Typography>

          {user && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Nome
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.name}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.email}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Assinatura
              </Typography>
              <Typography
                variant="body1"
                color={user.hasActiveSubscription ? 'success.main' : 'error.main'}
              >
                {user.hasActiveSubscription ? 'Ativa' : 'Inativa'}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography
              variant="button"
              color="error"
              sx={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Sair
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default GameLibrary;
