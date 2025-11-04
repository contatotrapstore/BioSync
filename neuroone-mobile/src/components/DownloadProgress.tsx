import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Stack,
  IconButton
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Close as CancelIcon
} from '@mui/icons-material';
import { InstallProgress } from '@services/contentUpdater';

/**
 * Componente visual de progresso de download
 */

export interface DownloadProgressProps {
  progress: InstallProgress;
  gameName?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  showControls?: boolean;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  progress,
  gameName,
  onPause,
  onResume,
  onCancel,
  showControls = true
}) => {
  const getPhaseText = () => {
    switch (progress.phase) {
      case 'downloading':
        return 'Baixando...';
      case 'extracting':
        return 'Extraindo arquivos...';
      case 'completed':
        return 'Concluído!';
      case 'error':
        return 'Erro';
      default:
        return 'Processando...';
    }
  };

  const getPhaseColor = () => {
    switch (progress.phase) {
      case 'downloading':
        return 'primary';
      case 'extracting':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 3,
        backgroundColor: 'rgba(17,20,28,0.95)',
        border: '1px solid rgba(255,217,19,0.2)'
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {gameName && (
              <Typography variant="subtitle1" fontWeight={600}>
                {gameName}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {getPhaseText()}
            </Typography>
          </Box>

          {showControls && progress.phase === 'downloading' && (
            <Box>
              {onPause && (
                <IconButton size="small" onClick={onPause} sx={{ mr: 0.5 }}>
                  <PauseIcon />
                </IconButton>
              )}
              {onCancel && (
                <IconButton size="small" onClick={onCancel} color="error">
                  <CancelIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Box>

        {/* Progress Bar */}
        <Box>
          <LinearProgress
            variant="determinate"
            value={progress.totalProgress}
            color={getPhaseColor() as any}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,217,19,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Progress Details */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {progress.phase === 'downloading' && `Download: ${progress.downloadProgress}%`}
            {progress.phase === 'extracting' && `Extração: ${progress.extractProgress}%`}
            {progress.phase === 'completed' && 'Instalado com sucesso'}
            {progress.phase === 'error' && progress.error}
          </Typography>

          <Typography variant="caption" fontWeight={600} color="primary.main">
            {progress.totalProgress}%
          </Typography>
        </Box>

        {/* Error Message */}
        {progress.error && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(211,47,47,0.1)',
              border: '1px solid rgba(211,47,47,0.3)'
            }}
          >
            <Typography variant="caption" color="error.main">
              {progress.error}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default DownloadProgress;
