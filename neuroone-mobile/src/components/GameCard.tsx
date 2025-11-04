import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { Game } from '@/types';
import { contentUpdater } from '@services/contentUpdater';
import { useNavigate } from 'react-router-dom';

/**
 * Card de jogo para a biblioteca
 */

export interface GameCardProps {
  game: Game;
  onDownload?: (game: Game) => void;
  onPlay?: (game: Game) => void;
  onDelete?: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = React.memo(({
  game,
  onDownload,
  onPlay,
  onDelete
}) => {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar se o jogo está instalado
  useEffect(() => {
    checkInstallation();
  }, [game.id]);

  const checkInstallation = async () => {
    try {
      const installed = await contentUpdater.isGameInstalled(game.id);
      setIsInstalled(installed);
    } catch (error) {
      console.error('[GameCard] Error checking installation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/game/${game.id}`);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(game);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(game);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja desinstalar ${title}?`)) {
      onDelete?.(game);
    }
  };

  const title = game.title || game.name || 'Jogo';

  // Placeholder para imagem (será substituído com imagem real)
  const gameImage =
    game.cover_image_local ||
    game.thumbnail ||
    game.cover_image ||
    `https://via.placeholder.com/300x200/140f00/ffd913?text=${encodeURIComponent(title)}`;

  const hasAccess = game.hasAccess !== false;
  const fileSize = game.file_size ?? game.zipSize ?? 0;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: 4,
        background:
          'linear-gradient(160deg, rgba(18,22,38,0.95) 0%, rgba(9,11,21,0.88) 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 22px 48px rgba(255,217,19,0.22)',
          borderColor: 'rgba(255,217,19,0.35)'
        }
      }}
    >
      <Box sx={{ position: 'relative', height: 150, overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="150"
          image={gameImage}
          alt={title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.85)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6,8,16,0.1) 0%, rgba(6,8,16,0.75) 65%, rgba(6,8,16,0.95) 100%)'
          }}
        />

        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
          {!hasAccess && (
            <Chip
              icon={<LockIcon />}
              label="Bloqueado"
              size="small"
              sx={{
                backgroundColor: 'rgba(211,47,47,0.92)',
                color: '#fff',
                fontWeight: 600
              }}
            />
          )}
          {hasAccess && isInstalled && (
            <Chip
              icon={<CheckIcon />}
              label="Instalado"
              size="small"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            flexWrap: 'wrap'
          }}
        >
          {game.category && (
            <Chip
              label={game.category}
              size="small"
              sx={{
                height: 22,
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                fontWeight: 500
              }}
            />
          )}
          {fileSize > 0 && (
            <Chip
              label={`${fileSizeMB} MB`}
              size="small"
              sx={{
                height: 22,
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                fontWeight: 500
              }}
            />
          )}
        </Stack>
      </Box>

      {/* Conteúdo */}
      <CardContent sx={{ pb: 1.5 }}>
        <Stack spacing={1.5}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.3,
              minHeight: '2.6em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.8em'
            }}
          >
            {game.description}
          </Typography>
        </Stack>
      </CardContent>

      {/* Ações */}
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        {loading && <LinearProgress sx={{ width: '100%', height: 2, borderRadius: 2 }} />}

        {!hasAccess && !loading && (
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<LockIcon />}
            disabled
          >
            Sem acesso
          </Button>
        )}

        {hasAccess && !isInstalled && !loading && (
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadClick}
            sx={{ fontWeight: 600 }}
          >
            Baixar jogo
          </Button>
        )}

        {hasAccess && isInstalled && !loading && (
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<PlayIcon />}
              onClick={handlePlayClick}
              sx={{ fontWeight: 600 }}
            >
              Jogar
            </Button>
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </CardActions>
    </Card>
  );
});

export default GameCard;
