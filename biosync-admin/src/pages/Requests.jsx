import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Stack,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  SportsEsports
} from '@mui/icons-material';
import { gameRequestsAPI } from '../services/gameRequestsApi';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogAction, setDialogAction] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await gameRequestsAPI.getAll({ limit: 100 });
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Erro ao carregar requisições:', err);
      setError(err.response?.data?.message || 'Falha ao carregar requisições');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request, action) => {
    setSelectedRequest(request);
    setDialogAction(action);
    setAdminResponse('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    setDialogAction('');
    setAdminResponse('');
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    setProcessing(selectedRequest.id);
    setError('');

    try {
      if (dialogAction === 'approve') {
        await gameRequestsAPI.approve(selectedRequest.id, adminResponse);
      } else {
        await gameRequestsAPI.reject(selectedRequest.id, adminResponse);
      }

      await fetchRequests();
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao processar requisição:', err);
      setError(err.response?.data?.message || 'Falha ao processar requisição');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'warning', icon: <Pending /> },
      approved: { label: 'Aprovado', color: 'success', icon: <CheckCircle /> },
      rejected: { label: 'Rejeitado', color: 'error', icon: <Cancel /> }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Requisições de Jogos
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gerencie as solicitações de acesso aos jogos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 0 }}>
          Nenhuma requisição encontrada
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuário</TableCell>
                <TableCell>Jogo</TableCell>
                <TableCell>Mensagem</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {request.user?.email?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {request.user?.email || 'Desconhecido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.user?.full_name || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SportsEsports fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {request.game?.name || 'Jogo desconhecido'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {request.request_message || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(request.status)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(request.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {request.status === 'pending' && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleOpenDialog(request, 'approve')}
                          disabled={processing === request.id}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleOpenDialog(request, 'reject')}
                          disabled={processing === request.id}
                        >
                          Rejeitar
                        </Button>
                      </Stack>
                    )}
                    {request.status !== 'pending' && request.admin_response && (
                      <Typography variant="caption" color="text.secondary">
                        {request.admin_response}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de Confirmação */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0 }
        }}
      >
        <DialogTitle>
          {dialogAction === 'approve' ? 'Aprovar Requisição' : 'Rejeitar Requisição'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {dialogAction === 'approve'
              ? (
                <>
                  <strong>ATENÇÃO:</strong> Ao aprovar esta requisição, <strong>TODOS OS JOGOS</strong> serão liberados automaticamente para o usuário <strong>{selectedRequest?.user?.email}</strong>.
                  <br /><br />
                  O usuário não precisará solicitar acesso aos outros jogos individualmente.
                </>
              )
              : `Tem certeza que deseja rejeitar a requisição de ${selectedRequest?.user?.email}?`
            }
          </DialogContentText>
          <TextField
            fullWidth
            label="Resposta (opcional)"
            multiline
            rows={3}
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder="Adicione uma mensagem para o usuário..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={processing}>
            Cancelar
          </Button>
          <Button
            onClick={handleProcessRequest}
            variant="contained"
            color={dialogAction === 'approve' ? 'success' : 'error'}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? 'Processando...' : dialogAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Requests;
