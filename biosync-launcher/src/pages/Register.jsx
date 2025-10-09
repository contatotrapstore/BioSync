import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Link,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment
} from '@mui/material';
import { PersonAdd, Payment, CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../services/api';
import { setStoredToken, setStoredUser } from '../services/storage';
import logoUrl from '../assets/logo-branca.png';

const steps = ['Criar Conta', 'Escolher Plano', 'Pagamento'];

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Dados do usuário
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Plano selecionado (fixo por enquanto)
  const [selectedPlan] = useState({
    id: 'monthly',
    name: 'Plano Mensal',
    value: 149.90,
    description: 'Acesso ilimitado a todos os jogos'
  });

  // Step 3: Dados de pagamento
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paymentData, setPaymentData] = useState(null);
  const [userData, setUserData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRegister = async () => {
    setError('');

    // Validações
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Preencha todos os campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        fullName: formData.full_name,
        email: formData.email,
        password: formData.password
      });

      const { token, user } = response.data.data;

      // Salvar token temporariamente
      await setStoredToken(token);
      await setStoredUser(user);
      setUserData(user);

      // Avançar para escolha de plano
      setActiveStep(1);
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = () => {
    // Já tem plano selecionado, avança para pagamento
    setActiveStep(2);
  };

  const handleCreateSubscription = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/payments/create', {
        paymentMethod: paymentMethod
      });

      const { subscription, payment, pixQrCode, pixCopyPaste } = response.data.data;

      setPaymentData({
        subscription,
        payment,
        pixQrCode,
        pixCopyPaste,
        method: paymentMethod
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Erro ao criar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    // Login automático já foi feito no registro
    onLogin();
    navigate('/library');
  };

  // Renderizar Step 1: Criar Conta
  const renderRegisterForm = () => (
    <Stack spacing={3}>
      <TextField
        fullWidth
        label="Nome Completo"
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        disabled={loading}
        autoFocus
      />

      <TextField
        fullWidth
        type="email"
        label="E-mail"
        name="email"
        value={formData.email}
        onChange={handleChange}
        disabled={loading}
      />

      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label="Senha"
        name="password"
        value={formData.password}
        onChange={handleChange}
        disabled={loading}
        helperText="Mínimo 6 caracteres"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <TextField
        fullWidth
        type={showConfirmPassword ? 'text' : 'password'}
        label="Confirmar Senha"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                edge="end"
                aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {error && <Alert severity="error">{error}</Alert>}

      <Button
        fullWidth
        size="large"
        variant="contained"
        onClick={handleRegister}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
        sx={{
          py: 1.5,
          background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
          }
        }}
      >
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </Button>

      <Typography variant="body2" align="center" color="text.secondary">
        Já tem uma conta?{' '}
        <Link
          component="button"
          onClick={() => navigate('/login')}
          sx={{ color: '#1f8a4c', cursor: 'pointer' }}
        >
          Fazer Login
        </Link>
      </Typography>
    </Stack>
  );

  // Renderizar Step 2: Escolher Plano
  const renderPlanSelection = () => (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '2px solid #1f8a4c',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(31,138,76,0.1) 0%, rgba(55,126,86,0.1) 100%)'
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#1f8a4c', fontWeight: 600 }}>
              {selectedPlan.name}
            </Typography>
            <Typography variant="h4" sx={{ color: '#1f8a4c', fontWeight: 700 }}>
              R$ {selectedPlan.value.toFixed(2)}
              <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>
                /mês
              </Typography>
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary">
            {selectedPlan.description}
          </Typography>

          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: '#1f8a4c', mb: 1 }}>
              ✓ Acesso ilimitado a todos os jogos
            </Typography>
            <Typography variant="body2" sx={{ color: '#1f8a4c', mb: 1 }}>
              ✓ Novos jogos adicionados mensalmente
            </Typography>
            <Typography variant="body2" sx={{ color: '#1f8a4c', mb: 1 }}>
              ✓ Suporte prioritário
            </Typography>
            <Typography variant="body2" sx={{ color: '#1f8a4c' }}>
              ✓ Cancele quando quiser
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Button
        fullWidth
        size="large"
        variant="contained"
        onClick={handleSelectPlan}
        startIcon={<Payment />}
        sx={{
          py: 1.5,
          background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
          }
        }}
      >
        Continuar para Pagamento
      </Button>
    </Stack>
  );

  // Renderizar Step 3: Pagamento
  const renderPayment = () => {
    if (paymentData) {
      // Mostrar dados de pagamento PIX
      if (paymentData.method === 'PIX') {
        return (
          <Stack spacing={3} alignItems="center">
            <CheckCircle sx={{ fontSize: 64, color: '#1f8a4c' }} />

            <Typography variant="h6" align="center">
              Assinatura Criada!
            </Typography>

            <Typography variant="body1" align="center" color="text.secondary">
              Escaneie o QR Code abaixo ou copie o código PIX para concluir o pagamento
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
              Após o pagamento, sua conta será ativada automaticamente e você poderá acessar todos os jogos!
            </Alert>

            <Button
              fullWidth
              variant="contained"
              onClick={handleFinish}
              sx={{
                background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
                }
              }}
            >
              Acessar Biblioteca de Jogos
            </Button>
          </Stack>
        );
      }
    }

    // Formulário de seleção de pagamento
    return (
      <Stack spacing={3}>
        <Typography variant="h6" align="center">
          Escolha a forma de pagamento
        </Typography>

        <Button
          fullWidth
          size="large"
          variant={paymentMethod === 'PIX' ? 'contained' : 'outlined'}
          onClick={() => setPaymentMethod('PIX')}
          sx={{
            py: 2,
            borderColor: '#1f8a4c',
            color: paymentMethod === 'PIX' ? '#fff' : '#1f8a4c',
            ...(paymentMethod === 'PIX' && {
              background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
              }
            })
          }}
        >
          PIX - R$ {selectedPlan.value.toFixed(2)}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={handleCreateSubscription}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #1f8a4c 0%, #377e56 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1a7340 0%, #2d6847 100%)'
            }
          }}
        >
          {loading ? 'Processando...' : 'Gerar Pagamento'}
        </Button>
      </Stack>
    );
  };

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
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 600,
          p: 4,
          borderRadius: 4,
          border: '1px solid rgba(55,126,86,0.25)'
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img src={logoUrl} alt="BioSync" style={{ height: 48, marginBottom: 16 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f8a4c' }}>
            Criar Conta BioSync
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Conteúdo do Step */}
        {activeStep === 0 && renderRegisterForm()}
        {activeStep === 1 && renderPlanSelection()}
        {activeStep === 2 && renderPayment()}
      </Paper>
    </Box>
  );
}

export default Register;
