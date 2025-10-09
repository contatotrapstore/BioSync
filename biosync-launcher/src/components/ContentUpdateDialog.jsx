import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Box,
  Alert
} from '@mui/material';
import {
  Download,
  SportsEsports,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import contentUpdater from '../services/contentUpdater';

function ContentUpdateDialog({ open, onClose }) {
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [updates, setUpdates] = useState(null);
  const [downloadResults, setDownloadResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open]);

  const checkForUpdates = async () => {
    setChecking(true);
    setError('');

    try {
      const result = await contentUpdater.checkForUpdates();
      setUpdates(result);
    } catch (err) {
      console.error('Erro ao verificar atualizações:', err);
      setError('Não foi possível verificar atualizações. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!updates || !updates.hasUpdates) return;

    setDownloading(true);
    setError('');

    try {
      const results = await contentUpdater.downloadNewGames(updates.games);
      setDownloadResults(results);

      // Atualizar versão do conteúdo
      await contentUpdater.updateContentVersion(updates.contentVersion);

      // Recarregar biblioteca após download
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Erro ao baixar jogos:', err);
      setError('Erro ao baixar jogos. Verifique sua conexão e tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  const renderContent = () => {
    if (checking) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Verificando atualizações...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!updates) return null;

    if (!updates.hasUpdates) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircle sx={{ fontSize: 64, color: '#1f8a4c', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Tudo atualizado!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Você já possui todos os jogos disponíveis.
          </Typography>
        </Box>
      );
    }

    if (downloading) {
      return (
        <Box sx={{ py: 2 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ mb: 2 }}>
            Baixando {updates.newGamesCount} novo(s) jogo(s)...
          </Typography>

          {downloadResults.length > 0 && (
            <List dense>
              {downloadResults.map((result) => (
                <ListItem key={result.gameId}>
                  <ListItemIcon>
                    {result.success ? (
                      <CheckCircle sx={{ color: '#1f8a4c' }} />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.success ? 'Instalado' : result.error}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          {updates.newGamesCount} novo(s) jogo(s) disponível(is) para download!
        </Alert>

        <List>
          {updates.games.map((game) => (
            <ListItem key={game.id}>
              <ListItemIcon>
                <SportsEsports sx={{ color: '#1f8a4c' }} />
              </ListItemIcon>
              <ListItemText
                primary={game.title}
                secondary={game.description || 'Novo jogo disponível'}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Os jogos serão baixados e instalados automaticamente.
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Download sx={{ color: '#1f8a4c' }} />
          <Typography variant="h6">Atualizações de Jogos</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>{renderContent()}</DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!downloading && (
          <>
            <Button onClick={onClose} disabled={checking}>
              {updates && !updates.hasUpdates ? 'Fechar' : 'Depois'}
            </Button>
            {updates && updates.hasUpdates && (
              <Button
                variant="contained"
                onClick={handleDownload}
                startIcon={<Download />}
                sx={{
                  background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
                  }
                }}
              >
                Baixar Agora
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ContentUpdateDialog;
