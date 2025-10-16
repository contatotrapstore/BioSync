import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  SportsEsports as GameIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  CloudDownload as CloudIcon,
  Storage as StorageIcon,
  Speed as VersionIcon
} from '@mui/icons-material';

const GameCard = ({ game, onEdit, onDelete }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
  };

  const hasDownloadInfo = game.downloadUrl || game.fileSize || game.version;

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 8
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: game.isActive
            ? 'linear-gradient(90deg, #c29600 0%, #ffd913 100%)'
            : 'linear-gradient(90deg, #757575 0%, #9e9e9e 100%)'
        }
      }}
    >
      {/* Imagem de Capa */}
      {game.coverImage ? (
        <CardMedia
          component="img"
          height="180"
          image={game.coverImage}
          alt={game.name}
          sx={{
            objectFit: 'cover',
            backgroundColor: 'grey.200'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <Box
          sx={{
            height: 180,
            background: 'linear-gradient(135deg, #ffb300 0%, #ffd913 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <GameIcon sx={{ fontSize: 80, color: 'white', opacity: 0.3 }} />
          <Typography
            variant="h5"
            sx={{
              position: 'absolute',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {game.name}
          </Typography>
        </Box>
      )}

      {/* Badge de Status */}
      <Chip
        label={game.isActive ? 'Ativo' : 'Inativo'}
        size="small"
        color={game.isActive ? 'success' : 'default'}
        sx={{
          position: 'absolute',
          top: 190,
          right: 12,
          fontWeight: 'bold',
          zIndex: 1
        }}
      />

      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
        {/* Título */}
        <Typography variant="h6" component="div" fontWeight="bold" gutterBottom noWrap>
          {game.name}
        </Typography>

        {/* Descrição */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '40px'
          }}
        >
          {game.description || 'Nenhuma descrição disponível'}
        </Typography>

        {/* Tags */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
          {game.category && (
            <Chip
              label={game.category}
              size="small"
              color="primary"
              variant="filled"
              sx={{ fontWeight: 500 }}
            />
          )}
          {game.slug && (
            <Chip
              label={game.slug}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        {/* Informações de Download */}
        {hasDownloadInfo && (
          <Box
            sx={{
              backgroundColor: 'action.hover',
              borderRadius: 1,
              p: 1.5,
              mb: 2
            }}
          >
            <Stack spacing={0.5}>
              {game.version && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VersionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Versão: <strong>{game.version}</strong>
                  </Typography>
                </Box>
              )}
              {game.fileSize && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Tamanho: <strong>{formatFileSize(game.fileSize)}</strong>
                  </Typography>
                </Box>
              )}
              {game.downloadUrl && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" fontWeight={500}>
                    Download disponível
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Rodapé do Card */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Tooltip title={game.folderPath || 'Sem pasta'}>
            <Chip
              icon={<FolderIcon />}
              label={`Ordem: ${game.order ?? 0}`}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, pt: 0 }}>
        <Button
          size="medium"
          startIcon={<EditIcon />}
          onClick={() => onEdit(game)}
          variant="contained"
          sx={{
            flexGrow: 1,
            mr: 1,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Editar Jogo
        </Button>
        <Tooltip title="Excluir jogo">
          <IconButton
            onClick={() => onDelete(game.id)}
            color="error"
            sx={{
              border: '1px solid',
              borderColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white'
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default GameCard;
