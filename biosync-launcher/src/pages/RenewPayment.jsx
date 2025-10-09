import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Grid
} from '@mui/material';
import { Payment, Pix, CreditCard, CheckCircle, ArrowBack } from '@mui/icons-material';
import api from '../services/api';
import logoUrl from '../assets/logo-branca.png';

function RenewPayment() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  // Dados do cartão
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });

  const handlePaymentMethodChange = (event, newMethod) => {
    if (newMethod) {
      setPaymentMethod(newMethod);
      setError('');
    }
  };

  const handleCardDataChange = (e) => {
    setCardData({
      ...cardData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleCreatePayment = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        paymentMethod
      };

      // Se for cartão, adicionar dados
      if (paymentMethod === 'CREDIT_CARD') {
        // Validar dados do cartão
        if (!cardData.holderName || !cardData.number || !cardData.expiryMonth ||
            !cardData.expiryYear || !cardData.ccv) {
          setError('Preencha todos os dados do cartão');
          setLoading(false);
          return;
        }

        payload.creditCard = {
          holderName: cardData.holderName,
          number: cardData.number.replace(/\s/g, ''),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv
        };

        payload.creditCardHolderInfo = {
          name: cardData.holderName,
          email: '', // Será preenchido pelo backend com email do usuário
          cpfCnpj: '', // Opcional
          postalCode: '', // Opcional
          addressNumber: '', // Opcional
          phone: '' // Opcional
        };
      }

      const response = await api.post('/payments/create', payload);

      const { payment, pixQrCode, pixCopyPaste, message } = response.data.data;

      setPaymentData({
        payment,
        pixQrCode,
        pixCopyPaste,
        message,
        method: paymentMethod
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar sucesso do pagamento
  if (paymentData) {
    if (paymentMethod === 'PIX') {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#070d0a', px: 2 }}>
          <Paper sx={{ maxWidth: 600, width: '100%', p: 4, borderRadius: 4 }}>
            <Stack spacing={3} alignItems="center">
              <img src={logoUrl} alt="BioSync" style={{ height: 48 }} />

              <CheckCircle sx={{ fontSize: 64, color: '#1f8a4c' }} />

              <Typography variant="h5" align="center" sx={{ fontWeight: 600 }}>
                Pagamento Criado!
              </Typography>

              <Typography variant="body1" align="center" color="text.secondary">
                Escaneie o QR Code ou copie o código PIX para concluir o pagamento
              </Typography>

              {paymentData.pixQrCode && (
                <Box
                  component="img"
                  src={paymentData.pixQrCode}
                  alt="QR Code PIX"
                  sx={{ width: 250, height: 250, border: '2px solid #1f8a4c', borderRadius: 2 }}
                />
              )}

              {paymentData.pixCopyPaste && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Código PIX Copia e Cola:
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      border: '1px solid rgba(31,138,76,0.3)',
                      wordBreak: 'break-all'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {paymentData.pixCopyPaste}
                    </Typography>
                  </Paper>
                  <Button
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      navigator.clipboard.writeText(paymentData.pixCopyPaste);
                    }}
                  >
                    Copiar Código
                  </Button>
                </Box>
              )}

              <Alert severity="info" sx={{ width: '100%' }}>
                Após o pagamento, sua conta será reativada automaticamente e você terá acesso por mais 30 dias!
              </Alert>

              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/library')}
                sx={{
                  background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
                  }
                }}
              >
                Voltar para Biblioteca
              </Button>
            </Stack>
          </Paper>
        </Box>
      );
    }

    // Cartão aprovado
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#070d0a', px: 2 }}>
        <Paper sx={{ maxWidth: 600, width: '100%', p: 4, borderRadius: 4 }}>
          <Stack spacing={3} alignItems="center">
            <img src={logoUrl} alt="NeuroGame" style={{ height: 48 }} />

            <CheckCircle sx={{ fontSize: 64, color: '#1f8a4c' }} />

            <Typography variant="h5" align="center" sx={{ fontWeight: 600 }}>
              Pagamento Aprovado!
            </Typography>

            <Typography variant="body1" align="center" color="text.secondary">
              {paymentData.message || 'Seu acesso foi renovado por mais 30 dias!'}
            </Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/library')}
              sx={{
                background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
                }
              }}
            >
              Acessar Jogos
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Formulário de pagamento
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#070d0a',
        backgroundImage:
          'radial-gradient(circle at 25% 20%, rgba(31,138,76,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(8,15,11,0.8), transparent 55%)',
        px: 2,
        py: 4
      }}
    >
      <Paper sx={{ maxWidth: 600, width: '100%', p: 4, borderRadius: 4, border: '1px solid rgba(55,126,86,0.25)' }}>
        <Stack spacing={3}>
          {/* Logo e título */}
          <Box sx={{ textAlign: 'center' }}>
            <img src={logoUrl} alt="NeuroGame" style={{ height: 48, marginBottom: 16 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f8a4c' }}>
              Renovar Acesso
            </Typography>
          </Box>

          {/* Plano */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '2px solid #1f8a4c',
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(31,138,76,0.1) 0%, rgba(55,126,86,0.1) 100%)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#1f8a4c', fontWeight: 600 }}>
                Plano Mensal
              </Typography>
              <Typography variant="h4" sx={{ color: '#1f8a4c', fontWeight: 700 }}>
                R$ 149,90
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ✓ Acesso por 30 dias • Todos os jogos • Suporte prioritário
            </Typography>
          </Paper>

          {/* Método de pagamento */}
          <Box>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
              Escolha a forma de pagamento:
            </Typography>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={handlePaymentMethodChange}
              fullWidth
            >
              <ToggleButton value="PIX" sx={{ py: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Pix />
                  <Typography>PIX</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="CREDIT_CARD" sx={{ py: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CreditCard />
                  <Typography>Cartão</Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Formulário de cartão */}
          {paymentMethod === 'CREDIT_CARD' && (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nome no Cartão"
                name="holderName"
                value={cardData.holderName}
                onChange={handleCardDataChange}
                placeholder="NOME COMPLETO"
              />
              <TextField
                fullWidth
                label="Número do Cartão"
                name="number"
                value={cardData.number}
                onChange={handleCardDataChange}
                placeholder="0000 0000 0000 0000"
                inputProps={{ maxLength: 19 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Mês"
                    name="expiryMonth"
                    value={cardData.expiryMonth}
                    onChange={handleCardDataChange}
                    placeholder="MM"
                    inputProps={{ maxLength: 2 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Ano"
                    name="expiryYear"
                    value={cardData.expiryYear}
                    onChange={handleCardDataChange}
                    placeholder="AAAA"
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="CVV"
                    name="ccv"
                    value={cardData.ccv}
                    onChange={handleCardDataChange}
                    placeholder="123"
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {/* Botões */}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/library')}
              sx={{ borderColor: '#1f8a4c', color: '#1f8a4c' }}
            >
              Voltar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreatePayment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
              sx={{
                background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
                }
              }}
            >
              {loading ? 'Processando...' : `Pagar R$ 149,90`}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export default RenewPayment;
