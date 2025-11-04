import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { apiService } from '@services/api';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useBackButton } from '@hooks/useBackButton';

/**
 * Página de renovação de assinatura
 * Suporta PIX e Cartão de Crédito
 */

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const RenewPayment: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  // Back button volta para biblioteca
  useBackButton(() => {
    navigate('/library');
  });

  const [planType, setPlanType] = useState<'monthly' | 'annual'>('monthly');
  const [paymentTab, setPaymentTab] = useState(0); // 0 = PIX, 1 = Cartão
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending');

  // Card form data (sem CVV por segurança)
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiryMonth: '',
    expiryYear: ''
  });

  // CVV armazenado apenas em ref para não persistir no estado
  const cvvRef = useRef<string>('');

  const planPrices = {
    monthly: 'R$ 29,90',
    annual: 'R$ 299,00'
  };

  useEffect(() => {
    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const handlePlanChange = (event: React.MouseEvent<HTMLElement>, newPlan: 'monthly' | 'annual' | null) => {
    if (newPlan !== null) {
      setPlanType(newPlan);
    }
  };

  const handlePaymentTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setPaymentTab(newValue);
  };

  const createPixPayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('pending');

      const response = await apiService.createPayment({
        planType,
        paymentMethod: 'pix'
      });

      setPaymentData(response);
      setPaymentStatus('processing');

      // Limpar polling anterior se existir
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Iniciar polling para verificar pagamento (a cada 5s)
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const status = await apiService.getPaymentStatus(response.paymentId);

          if (status.status === 'completed' || status.status === 'RECEIVED') {
            setPaymentStatus('completed');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            showSuccess('Pagamento confirmado! Assinatura renovada.');

            // Redirecionar após 2s
            setTimeout(() => {
              navigate('/library');
            }, 2000);
          } else if (status.status === 'error' || status.status === 'FAILED') {
            setPaymentStatus('error');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            showError('Pagamento falhou. Tente novamente.');
          }
        } catch (error) {
          console.error('[RenewPayment] Error checking payment status:', error);
        }
      }, 5000);
    } catch (error: any) {
      console.error('[RenewPayment] Error creating PIX payment:', error);
      showError(error.message || 'Erro ao gerar PIX');
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const createCardPayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('pending');

      // Validar dados do cartão
      if (!cardData.number || !cardData.name || !cardData.expiryMonth || !cardData.expiryYear || !cvvRef.current) {
        showError('Preencha todos os campos do cartão');
        setLoading(false);
        return;
      }

      // Capturar CVV e limpar ref imediatamente
      const cvv = cvvRef.current;
      cvvRef.current = ''; // Limpar CVV da memória

      const response = await apiService.createPayment({
        planType,
        paymentMethod: 'credit_card',
        cardData: {
          number: cardData.number.replace(/\s/g, ''),
          holderName: cardData.name,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cvv
        }
      });

      setPaymentStatus('completed');
      showSuccess('Pagamento aprovado! Assinatura renovada.');

      // Limpar dados do formulário
      setCardData({
        number: '',
        name: '',
        expiryMonth: '',
        expiryYear: ''
      });

      setTimeout(() => {
        navigate('/library');
      }, 2000);
    } catch (error: any) {
      console.error('[RenewPayment] Error creating card payment:', error);
      showError(error.message || 'Erro ao processar pagamento');
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (paymentData?.pixCode) {
      navigator.clipboard.writeText(paymentData.pixCode);
      showSuccess('Código PIX copiado!');
    }
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardData({ ...cardData, number: formatCardNumber(value) });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 2,
          px: 2
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/library')} sx={{ color: 'inherit' }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Renovar Assinatura
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 3 }}>
        {/* Success State */}
        {paymentStatus === 'completed' && (
          <Card sx={{ mb: 3, bgcolor: 'success.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SuccessIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>
                    Pagamento Confirmado!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'success.dark' }}>
                    Sua assinatura foi renovada com sucesso.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Escolha seu plano
            </Typography>

            <ToggleButtonGroup
              value={planType}
              exclusive
              onChange={handlePlanChange}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="monthly">
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Mensal
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {planPrices.monthly}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    /mês
                  </Typography>
                </Box>
              </ToggleButton>

              <ToggleButton value="annual">
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Anual
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {planPrices.annual}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Economize 17%
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            <Alert severity="info" sx={{ mt: 2 }}>
              Acesso ilimitado a todos os jogos terapêuticos
            </Alert>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Forma de pagamento
            </Typography>

            <Tabs value={paymentTab} onChange={handlePaymentTabChange} variant="fullWidth">
              <Tab label="PIX" />
              <Tab label="Cartão de Crédito" />
            </Tabs>

            {/* PIX Tab */}
            <TabPanel value={paymentTab} index={0}>
              {!paymentData ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Pagamento instantâneo via PIX
                  </Typography>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={createPixPayment}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Gerar QR Code PIX'}
                  </Button>
                </Box>
              ) : (
                <Box>
                  {/* QR Code */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'white',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <QRCode value={paymentData.pixCode || ''} size={200} />
                    </Box>
                  </Box>

                  {/* PIX Code */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      Código PIX Copia e Cola
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        value={paymentData.pixCode || ''}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                          }
                        }}
                      />
                      <IconButton onClick={copyPixCode} color="primary">
                        <CopyIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Status */}
                  {paymentStatus === 'processing' && (
                    <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        Aguardando pagamento... Verificando a cada 5 segundos.
                      </Typography>
                    </Alert>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    O QR Code expira em 30 minutos
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Card Tab */}
            <TabPanel value={paymentTab} index={1}>
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Número do Cartão"
                  value={cardData.number}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  fullWidth
                />

                <TextField
                  label="Nome no Cartão"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                  placeholder="NOME COMPLETO"
                  fullWidth
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Mês"
                    value={cardData.expiryMonth}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 2 && /^\d*$/.test(value)) {
                        setCardData({ ...cardData, expiryMonth: value });
                      }
                    }}
                    placeholder="MM"
                    sx={{ width: '30%' }}
                  />

                  <TextField
                    label="Ano"
                    value={cardData.expiryYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 4 && /^\d*$/.test(value)) {
                        setCardData({ ...cardData, expiryYear: value });
                      }
                    }}
                    placeholder="AAAA"
                    sx={{ width: '40%' }}
                  />

                  <TextField
                    label="CVV"
                    type="password"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 4 && /^\d*$/.test(value)) {
                        cvvRef.current = value;
                      }
                    }}
                    placeholder="123"
                    sx={{ width: '30%' }}
                    inputProps={{ maxLength: 4 }}
                  />
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={createCardPayment}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : `Pagar ${planPrices[planType]}`}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Pagamento seguro via Asaas
                </Typography>
              </Box>
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RenewPayment;
