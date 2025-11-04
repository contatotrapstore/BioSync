import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Chip } from '@mui/material';
import { CloudOff as OfflineIcon } from '@mui/icons-material';
import { Game } from '@/types';
import { apiService } from '@services/api';
import { authService } from '@services/auth';
import { contentUpdater } from '@services/contentUpdater';
import { GameWebView } from '@components/GameWebView';
import { storage } from '@cap/storage';

/**
 * Página para jogar o jogo (fullscreen)
 * Suporta modo offline para jogos instalados
 */

export const GamePlay: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  const loadGame = async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError(null);
      setSubscriptionError(false);
      setIsOffline(false);

      // 1. Verificar se jogo está instalado
      const isInstalled = await contentUpdater.isGameInstalled(gameId);

      // 2. Se instalado, permitir jogar mesmo offline
      if (isInstalled) {
        console.log(`[GamePlay] Game ${gameId} is installed, checking for cached data`);

        // Tentar buscar dados do jogo (online primeiro, cache se falhar)
        try {
          const fetchedGame = await apiService.getGame(gameId);

          // Cachear metadados
          await storage.setItem(`game_${gameId}`, JSON.stringify(fetchedGame));

          setGame(fetchedGame);
          setIsOffline(false);
        } catch (networkError) {
          console.warn('[GamePlay] Network error, using cached data:', networkError);

          // Fallback para cache local
          const cachedData = await storage.getItem(`game_${gameId}`);

          if (cachedData) {
            setGame(JSON.parse(cachedData) as Game);
            setIsOffline(true); // Indicar que está offline
          } else {
            // Criar objeto mínimo se não houver cache
            setGame({
              id: gameId,
              title: 'Jogo Offline',
              name: 'Jogo Offline',
              description: 'Jogando sem conexão',
              category: 'memory',
              difficulty: 'easy',
              duration: 0,
              thumbnail: '',
              tags: [],
              zipUrl: '',
              zipSize: 0,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as Game);
            setIsOffline(true);
          }
        }
      } else {
        // 3. Se não instalado, exigir assinatura E internet
        const user = await authService.getCurrentUser();

        if (!user || !user.hasActiveSubscription) {
          console.warn('[GamePlay] User does not have active subscription');
          setSubscriptionError(true);
          setLoading(false);
          return;
        }

        // Carregar jogo do servidor
        const fetchedGame = await apiService.getGame(gameId);

        // Cachear metadados
        await storage.setItem(`game_${gameId}`, JSON.stringify(fetchedGame));

        setGame(fetchedGame);
      }
    } catch (err: any) {
      console.error('[GamePlay] Error loading game:', err);
      setError('Erro ao carregar jogo. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    navigate(`/game/${gameId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#000'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Subscription error state
  if (subscriptionError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          p: 3,
          textAlign: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Assinatura Necessária
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Você precisa de uma assinatura ativa para jogar este jogo.
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/renew-payment')}>
            Assinar Agora
          </Button>
          <Button variant="outlined" onClick={() => navigate('/library')}>
            Voltar
          </Button>
        </Box>
      </Box>
    );
  }

  if (error || !game) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          p: 3
        }}
      >
        <Alert severity="error" onClose={handleExit}>
          {error || 'Jogo não encontrado'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh' }}>
      {/* Indicador de modo offline */}
      {isOffline && (
        <Chip
          icon={<OfflineIcon />}
          label="Modo Offline"
          color="warning"
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 9999,
            boxShadow: 3
          }}
        />
      )}

      <GameWebView game={game} onExit={handleExit} />
    </Box>
  );
};

export default GamePlay;
