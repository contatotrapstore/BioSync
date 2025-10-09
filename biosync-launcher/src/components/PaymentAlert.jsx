import { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box
} from '@mui/material';
import { Payment, Warning } from '@mui/icons-material';
import api from '../services/api';

function PaymentAlert() {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    checkPaymentStatus();
    // Verificar a cada 30 minutos
    const interval = setInterval(checkPaymentStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get('/subscriptions/check');
      const { isActive, needsRenewal, daysUntilExpiration } = response.data.data;

      const subscription = {
        isActive,
        needsRenewal,
        daysUntilExpiry: daysUntilExpiration,
        isExpired: !isActive
      };

      setPaymentStatus({ hasActivePayment: isActive, subscription });

      // Mostrar alerta se estiver próximo de vencer ou vencido
      if (needsRenewal) {
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Erro ao verificar status de pagamento:', error);
    }
  };

  const handleRenewClick = () => {
    setShowDialog(true);
    setShowAlert(false);
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleRenewPayment = async () => {
    // Abrir tela de pagamento (pode ser um modal ou redirecionar)
    window.location.href = '/renew-payment'; // Ou abrir modal
  };

  if (!paymentStatus || !paymentStatus.subscription) {
    return null;
  }

  const { subscription } = paymentStatus;
  const { daysUntilExpiry, isExpired } = subscription;

  // Determinar tipo de alerta
  const alertSeverity = isExpired ? 'error' : daysUntilExpiry <= 3 ? 'warning' : 'info';
  const alertMessage = isExpired
    ? 'Seu acesso expirou! Renove para continuar jogando.'
    : `Seu acesso vence em ${daysUntilExpiry} dia${daysUntilExpiry > 1 ? 's' : ''}. Renove agora!`;

  return (
    <>
      {/* Snackbar de notificação */}
      <Snackbar
        open={showAlert}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity={alertSeverity}
          icon={<Warning />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRenewClick}
              startIcon={<Payment />}
            >
              Renovar
            </Button>
          }
          onClose={handleCloseAlert}
        >
          <AlertTitle>
            {isExpired ? 'Acesso Expirado' : 'Renovação Necessária'}
          </AlertTitle>
          {alertMessage}
        </Alert>
      </Snackbar>

      {/* Dialog de renovação */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment sx={{ color: '#1f8a4c' }} />
            <Typography variant="h6">Renovar Acesso</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {isExpired ? (
              <>
                <Typography variant="body1" gutterBottom>
                  Seu acesso ao biosync expirou.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Para continuar jogando, renove seu pagamento mensal de R$ 149,90.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" gutterBottom>
                  Seu acesso vence em {daysUntilExpiry} dia{daysUntilExpiry > 1 ? 's' : ''}.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Renove agora para garantir acesso ininterrupto a todos os jogos!
                </Typography>
              </>
            )}

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(31,138,76,0.1)',
                border: '1px solid rgba(31,138,76,0.3)'
              }}
            >
              <Typography variant="h6" sx={{ color: '#1f8a4c', mb: 1 }}>
                Plano Mensal
              </Typography>
              <Typography variant="h4" sx={{ color: '#1f8a4c', fontWeight: 700 }}>
                R$ 149,90
                <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>
                  /mês
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                • Acesso ilimitado a todos os jogos<br />
                • Válido por 30 dias<br />
                • Pagamento via PIX ou Cartão
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>
            Depois
          </Button>
          <Button
            variant="contained"
            onClick={handleRenewPayment}
            startIcon={<Payment />}
            sx={{
              background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
              }
            }}
          >
            Renovar Agora
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PaymentAlert;
