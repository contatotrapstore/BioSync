import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Game } from '@/types';
import { apiService } from '@services/api';
import { contentUpdater } from '@services/contentUpdater';
import { useDownload } from '@hooks/useDownload';
import { useBackButton } from '@hooks/useBackButton';
import DownloadProgress from '@components/DownloadProgress';
import { useSnackbar } from '@/contexts/SnackbarContext';

/**
 * Página de detalhes do jogo
 */

export const GameDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { downloadState, downloadGame, resetDownload } = useDownload();
  const { showError, showWarning, showSuccess } = useSnackbar();

  // Back button volta para biblioteca
  useBackButton(() => {
    navigate('/library');
  });

  const [game, setGame] = useState<Game | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      loadGameDetails();
    }
  }, [gameId]);

  useEffect(() => {
    if (downloadState.error) {
      showError(downloadState.error);
    }
  }, [downloadState.error, showError]);

  const loadGameDetails = async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar detalhes do jogo
      const fetchedGame = await apiService.getGame(gameId);
      setGame(fetchedGame);

      // Verificar se está instalado
      const installed = await contentUpdater.isGameInstalled(gameId);
      setIsInstalled(installed);
    } catch (err: any) {
      console.error('[GameDetail] Error loading game:', err);
      setError('Erro ao carregar detalhes do jogo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!game) return;

    const downloadUrl = game.download_url ?? game.zipUrl;

    if (!downloadUrl) {
      showWarning('Este jogo ainda não possui um arquivo disponível para download. Tente novamente mais tarde.');
      return;
    }

    const success = await downloadGame(game);

    if (success) {
      setIsInstalled(true);
      showSuccess('Jogo instalado com sucesso.');
      setTimeout(resetDownload, 1500);
    }
  };

  const handlePlay = () => {
    navigate(`/game/${gameId}/play`);
  };

  const handleDelete = async () => {
    if (!gameId) return;

    const title = game?.title || game?.name || 'este jogo';

    if (!confirm(`Deseja desinstalar ${title}?`)) {
      return;
    }

    try {
      await contentUpdater.uninstallGame(gameId);
      setIsInstalled(false);
    } catch (error) {
      console.error('[GameDetail] Delete error:', error);
      alert('Erro ao desinstalar jogo');
    }
  };

  const handleBack = () => {
    navigate('/library');
  };

  if (loading) {
    return (
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
    );
  }

  if (error || !game) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" onClose={handleBack}>
          {error || 'Jogo não encontrado'}
        </Alert>
      </Container>
    );
  }

  const hasAccess = game.hasAccess !== false;
  const fileSize = game.file_size ?? game.zipSize ?? 0;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);
  const title = game.title || game.name || 'Jogo';
  const gameImage =
    game.cover_image_local ||
    game.thumbnail ||
    game.cover_image ||
    `https://via.placeholder.com/800x400/140f00/ffd913?text=${encodeURIComponent(title)}`;

  const downloadUrl = game.download_url ?? game.zipUrl;
  const sizeLabel = fileSize > 0 ? `${fileSizeMB} MB` : 'tamanho indisponível';
  const canDownload = hasAccess && !isInstalled && !downloadState.isDownloading && Boolean(downloadUrl);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: 6,
        background:
          'radial-gradient(circle at 0% -10%, rgba(255,217,19,0.12) 0%, rgba(5,7,15,0.96) 55%), radial-gradient(circle at 110% 0%, rgba(102,230,185,0.12) 0%, rgba(5,7,15,0.98) 60%)'
      }}
    >
      {/* Header com Imagem */}
      <Box
        sx={{
          position: 'relative',
          height: 240,
          backgroundImage: `url(${gameImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: 3,
          pb: 3,
          pt: 3,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(4,6,14,0.4) 0%, rgba(4,6,14,0.92) 85%)'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
          <Button
            onClick={handleBack}
            startIcon={<BackIcon />}
            sx={{
              borderRadius: 2,
              px: 2,
              py: 0.75,
              fontWeight: 600,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.75)'
              }
            }}
          >
            Voltar
          </Button>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'relative', zIndex: 1, flexWrap: 'wrap' }}
        >
          {game.category && (
            <Chip label={game.category} color="primary" size="small" sx={{ borderRadius: 1.5 }} />
          )}
          {game.difficulty && (
            <Chip label={game.difficulty} variant="outlined" size="small" sx={{ borderRadius: 1.5 }} />
          )}
          {fileSize > 0 && (
            <Chip label={`${fileSizeMB} MB`} variant="outlined" size="small" sx={{ borderRadius: 1.5 }} />
          )}
          {isInstalled && <Chip label="Instalado" size="small" color="success" sx={{ borderRadius: 1.5 }} />}
        </Stack>
      </Box>

      <Container maxWidth="md" sx={{ mt: -4, position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.05)',
            background:
              'linear-gradient(150deg, rgba(18,22,38,0.94) 0%, rgba(8,11,18,0.9) 100%)'
          }}
        >
          <Stack spacing={3.5}>
            {/* Título e estatísticas */}
            <Stack spacing={1.5}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {game.description}
              </Typography>

              <Divider flexItem light sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Última atualização
                  </Typography>
                  <Typography variant="body2">
                    {game.updatedAt ? new Date(game.updatedAt).toLocaleDateString('pt-BR') : '—'}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Tipo de acesso
                  </Typography>
                  <Typography variant="body2">
                    {hasAccess ? 'Liberado para sua assinatura' : 'Restrito'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            {/* Download Progress */}
            {downloadState.isDownloading && downloadState.progress && (
              <DownloadProgress progress={downloadState.progress} showControls={false} />
            )}

            {downloadState.error && (
              <Alert severity="error">{downloadState.error}</Alert>
            )}

            {/* Actions */}
            <Stack spacing={2}>
              {!hasAccess && (
                <Alert severity="warning" icon={<InfoIcon />}>
                  Você não tem acesso a este jogo. Entre em contato com seu psicólogo para habilitar
                  o conteúdo.
                </Alert>
              )}

              {hasAccess && !downloadUrl && (
                <Alert severity="info">
                  O arquivo de download ainda não foi disponibilizado para este jogo. Assim que estiver pronto você poderá instalá-lo por aqui.
                </Alert>
              )}

              {canDownload && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={!canDownload}
                  sx={{
                    py: 1.4,
                    fontWeight: 700,
                    borderRadius: 2,
                    background:
                      'linear-gradient(135deg, #FFD913 0%, #FFC43A 45%, #FFE36E 100%)',
                    color: '#070910'
                  }}
                >
                  Baixar e instalar ({sizeLabel})
                </Button>
              )}

              {hasAccess && isInstalled && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PlayIcon />}
                    onClick={handlePlay}
                    sx={{ py: 1.4, fontWeight: 700, borderRadius: 2 }}
                  >
                    Iniciar sessão
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    color="error"
                    sx={{ py: 1.4, fontWeight: 600, borderRadius: 2 }}
                  >
                    Desinstalar
                  </Button>
                </Stack>
              )}
            </Stack>

            {/* Tags */}
            {game.tags && game.tags.length > 0 && (
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Tags clínicas
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  {game.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" sx={{ mb: 0.5 }} />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default GameDetail;
