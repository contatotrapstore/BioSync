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
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { Cancel as CancelIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import api from '../services/api';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data?.data?.subscriptions || response.data?.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err.response?.data?.message || err.message || 'Falha ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusChip = (status) => {
    const statusMap = {
      active: { label: 'Ativa', color: 'success' },
      cancelled: { label: 'Cancelada', color: 'error' },
      pending: { label: 'Pendente', color: 'warning' },
      expired: { label: 'Expirada', color: 'default' }
    };

    const statusInfo = statusMap[status] || { label: status, color: 'default' };

    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        icon={status === 'active' ? <CheckCircleIcon /> : status === 'cancelled' ? <CancelIcon /> : undefined}
      />
    );
  };

  const getDaysRemaining = (nextDueDate) => {
    if (!nextDueDate) return null;
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return '1 dia restante';
    return `${diffDays} dias restantes`;
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Assinaturas Ativas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize e gerencie todas as assinaturas dos usuários
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : subscriptions.length === 0 ? (
        <Alert severity="info">
          Nenhuma assinatura encontrada.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Usuário</strong></TableCell>
                <TableCell><strong>E-mail</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Valor</strong></TableCell>
                <TableCell><strong>Ciclo</strong></TableCell>
                <TableCell><strong>Início</strong></TableCell>
                <TableCell><strong>Próximo Vencimento</strong></TableCell>
                <TableCell><strong>Método Pagamento</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((subscription) => {
                const daysRemaining = getDaysRemaining(subscription.next_due_date);
                const user = subscription.user || {};

                return (
                  <TableRow key={subscription.id} hover>
                    <TableCell>{user.full_name || user.fullName || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{getStatusChip(subscription.status)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(subscription.plan_value || subscription.planValue)}
                    </TableCell>
                    <TableCell>
                      {subscription.billing_cycle === 'MONTHLY' ? 'Mensal' :
                       subscription.billing_cycle === 'YEARLY' ? 'Anual' :
                       subscription.billing_cycle || '-'}
                    </TableCell>
                    <TableCell>{formatDate(subscription.started_at)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(subscription.next_due_date)}
                        </Typography>
                        {daysRemaining && subscription.status === 'active' && (
                          <Typography
                            variant="caption"
                            color={daysRemaining.includes('Venc') ? 'error' : 'text.secondary'}
                          >
                            {daysRemaining}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {subscription.payment_method === 'PIX' ? 'PIX' :
                       subscription.payment_method === 'CREDIT_CARD' ? 'Cartão de Crédito' :
                       subscription.payment_method === 'manual' ? 'Manual' :
                       subscription.payment_method || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Subscriptions;
