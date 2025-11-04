import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Link,
  IconButton,
  InputAdornment,
  Card,
  Divider,
  Chip
} from '@mui/material';
import { PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import { authService } from '@services/auth';
import { RegisterData } from '@/types';
import logoImg from '@/assets/logo.png';

interface RegisterProps {
  onLogin: () => void;
}

function Register({ onLogin }: RegisterProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.name || !formData.email || !formData.password) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.register(formData);

      // Registro bem-sucedido, fazer login automático
      onLogin();
      navigate('/library');
    } catch (err: any) {
      console.error('[Register] Error:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2.5,
        py: 6,
        background:
          'radial-gradient(circle at 10% 10%, rgba(255,217,19,0.12) 0%, rgba(5,7,15,0.95) 55%), radial-gradient(circle at 85% 0%, rgba(102,230,185,0.12) 0%, rgba(5,7,15,0.95) 55%)'
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 440,
          px: { xs: 3, sm: 4 },
          py: { xs: 4, sm: 5 },
          borderRadius: 5,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.05)',
          background:
            'linear-gradient(165deg, rgba(18,22,38,0.95) 0%, rgba(7,9,18,0.92) 100%)'
        }}
      >
        <Stack spacing={4}>
          <Stack spacing={2} alignItems="center">
            <Box
              component="img"
              src={logoImg}
              alt="Logo NeuroOne"
              sx={{
                width: 104,
                height: 104,
                borderRadius: '50%',
                objectFit: 'cover',
                p: 1.2,
                border: '1px solid rgba(255,217,19,0.4)',
                background:
                  'radial-gradient(circle at 30% 20%, rgba(255,217,19,0.55), rgba(5,7,15,0.0) 70%)',
                boxShadow: '0 18px 35px rgba(0,0,0,0.45)'
              }}
            />

            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h4">Criar conta</Typography>
              <Typography variant="body2" color="text.secondary">
                Personalize a jornada de cada paciente com neurogames
              </Typography>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          <Stack
            component="form"
            spacing={2.2}
            noValidate
            onSubmit={handleRegister}
          >
            <TextField
              fullWidth
              label="Nome completo"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              autoFocus
              required
              inputMode="text"
              InputProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.03)'
                }
              }}
            />

            <TextField
              fullWidth
              type="email"
              label="E-mail"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              placeholder="seu@email.com"
              inputMode="email"
              InputProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.03)'
                }
              }}
            />

            <TextField
              fullWidth
              label="Telefone (opcional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              InputProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.03)'
                }
              }}
            />

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Senha"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              helperText="Mínimo 6 caracteres"
              InputProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.03)'
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      size="small"
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
              label="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              disabled={loading}
              required
              InputProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.03)'
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              size="large"
              variant="contained"
              disabled={loading}
              startIcon={!loading ? <PersonAdd /> : null}
              sx={{
                py: 1.4,
                fontSize: '1.05rem',
                fontWeight: 700,
                background:
                  'linear-gradient(135deg, #FFD913 0%, #FFC43A 40%, #FFE36E 100%)',
                color: '#070910'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar conta'}
            </Button>
          </Stack>

          <Stack spacing={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Já tem uma conta?
            </Typography>
            <Button
              color="primary"
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 600 }}
            >
              Fazer login
            </Button>
            <Divider flexItem sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            <Stack direction="row" spacing={1} justifyContent="center">
              <Chip label="Monitoramento inteligente" variant="outlined" />
              <Chip label="Relatórios clínicos" variant="outlined" />
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}

export default Register;
