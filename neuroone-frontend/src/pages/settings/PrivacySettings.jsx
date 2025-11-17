import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Card as MuiCard,
  CardContent,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(null);
  const [myData, setMyData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Carregar consentimento do usuário
  useEffect(() => {
    if (user) {
      loadConsent();
    }
  }, [user]);

  async function loadConsent() {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const response = await fetch(`${API_URL}/api/privacy/my-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setConsent(result.consent);
        setMyData(result);
      }
    } catch (error) {
      console.error('Erro ao carregar consentimento:', error);
    }
  }

  // Visualizar dados
  async function handleViewMyData() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const response = await fetch(`${API_URL}/api/privacy/my-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const result = await response.json();
      setMyData(result);

      // Mostrar dados em modal ou expandir na tela
      setSuccess('Dados carregados com sucesso! Veja abaixo.');
    } catch (error) {
      setError(error.message || 'Erro ao visualizar dados');
    } finally {
      setLoading(false);
    }
  }

  // Exportar dados
  async function handleExportData() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const response = await fetch(`${API_URL}/api/privacy/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neuroone-data-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Dados exportados com sucesso!');
    } catch (error) {
      setError(error.message || 'Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  }

  // Solicitar exclusão de conta
  async function handleDeleteAccount() {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setError('Digite exatamente "DELETE_MY_ACCOUNT" para confirmar');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const response = await fetch(`${API_URL}/api/privacy/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation: 'DELETE_MY_ACCOUNT',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao solicitar exclusão');
      }

      const result = await response.json();
      setSuccess(result.message);
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');

      // Fazer logout após 3 segundos
      setTimeout(() => {
        supabase.auth.signOut();
      }, 3000);
    } catch (error) {
      setError(error.message || 'Erro ao solicitar exclusão de conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Privacidade e Dados Pessoais
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          Gerencie seus dados e direitos conforme a LGPD (Lei 13.709/2018)
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Status do Consentimento */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {consent ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
            <Box>
              <Typography variant="h2" sx={{ mb: 0.5 }}>
                Status do Consentimento LGPD
              </Typography>
              {consent ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Último consentimento: {new Date(consent.accepted_at).toLocaleDateString('pt-BR')} - Versão{' '}
                  {consent.version}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'warning.main' }}>
                  Consentimento não encontrado. Você pode precisar aceitar os termos novamente.
                </Typography>
              )}
            </Box>
          </Stack>

          {consent && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Consentimentos Ativos:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color={consent.data_processing_consent ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText primary="Processamento de dados pessoais" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color={consent.eeg_data_consent ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText primary="Coleta de dados de EEG (dados sensíveis de saúde)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color={consent.research_consent ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText primary="Uso anônimo para pesquisas científicas (opcional)" />
                </ListItem>
              </List>
            </Box>
          )}
        </Card>

        {/* Direitos LGPD */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Seus Direitos (Art. 18 da LGPD)
          </Typography>

          <Stack spacing={2}>
            {/* Visualizar Dados */}
            <MuiCard variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VisibilityIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Acessar Meus Dados
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Visualize todos os dados pessoais que coletamos sobre você
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleViewMyData}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <VisibilityIcon />}
                  >
                    Visualizar
                  </Button>
                </Stack>
              </CardContent>
            </MuiCard>

            {/* Exportar Dados */}
            <MuiCard variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DownloadIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Exportar Dados (Portabilidade)
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Baixe todos os seus dados em formato JSON
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleExportData}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
                  >
                    Exportar
                  </Button>
                </Stack>
              </CardContent>
            </MuiCard>

            {/* Deletar Conta */}
            <MuiCard variant="outlined" sx={{ borderColor: 'error.main' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DeleteForeverIcon color="error" />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'error.main' }}>
                        Excluir Minha Conta
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Solicite a exclusão permanente da sua conta e dados (período de 30 dias)
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={loading}
                    startIcon={<DeleteForeverIcon />}
                  >
                    Excluir
                  </Button>
                </Stack>
              </CardContent>
            </MuiCard>
          </Stack>
        </Card>

        {/* Visualização dos Dados */}
        {myData && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              Meus Dados Coletados
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Dados exportados em: {new Date(myData.exportedAt).toLocaleString('pt-BR')}
            </Alert>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Informações Pessoais:
                </Typography>
                <Typography variant="body2">Nome: {myData.user?.name}</Typography>
                <Typography variant="body2">E-mail: {myData.user?.email}</Typography>
                <Typography variant="body2">Função: {myData.user?.role}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Sessões Participadas: {myData.sessions?.length || 0}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Métricas de EEG: {myData.eegMetrics?.length || 0} registros
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  <strong>Finalidade:</strong> {myData.dataCollectionPurpose?.personalData}
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  <strong>Período de Retenção:</strong> {myData.retentionPeriod}
                </Typography>
              </Box>
            </Stack>
          </Card>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningIcon color="error" />
              <Typography variant="h3" component="span">
                Confirmar Exclusão de Conta
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Esta ação não pode ser desfeita após 30 dias!
              </Typography>
            </Alert>

            <DialogContentText sx={{ mb: 2 }}>
              Ao solicitar a exclusão da sua conta:
            </DialogContentText>
            <List dense>
              <ListItem>
                <ListItemText primary="• Seus dados pessoais serão anonimizados" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Seus dados de EEG serão desvinculados da sua identidade" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Você terá 30 dias para cancelar esta solicitação" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Após 30 dias, a exclusão será permanente" />
              </ListItem>
            </List>

            <TextField
              fullWidth
              label='Digite "DELETE_MY_ACCOUNT" para confirmar'
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              sx={{ mt: 3 }}
              error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
              helperText="Confirmação necessária para prosseguir"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteAccount}
              disabled={loading || deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
              startIcon={loading ? <CircularProgress size={16} /> : <DeleteForeverIcon />}
            >
              Confirmar Exclusão
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
