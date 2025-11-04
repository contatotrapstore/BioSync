import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Link,
  Divider,
  Chip
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { authService } from '@services/auth';
import logoImg from '@/assets/logo.png';

interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Preencha email e senha');
      return;
    }

    setLoading(true);

    try {
      await authService.login(formData.email, formData.password);

      onLogin();
      navigate('/library');
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err.message || 'Email ou senha incorretos. Tente novamente.');
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
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 420,
          px: { xs: 3, sm: 4 },
          py: { xs: 4, sm: 5 },
          borderRadius: 5,
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.04)',
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
              <Typography variant="h4">NeuroOne</Typography>
              <Typography variant="body2" color="text.secondary">
                Plataforma de neurogames personalizados
              </Typography>
            </Stack>
          </Stack>

          <Stack spacing={3}>
            <Stack spacing={1} textAlign="center">
              <Typography variant="h5">Bem-vindo de volta</Typography>
              <Typography variant="body2" color="text.secondary">
                Acesse sua biblioteca de jogos terapêuticos
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
                {error}
              </Alert>
            )}

            <Stack
              component="form"
              onSubmit={handleSubmit}
              spacing={2.2}
              noValidate
            >
              <TextField
                label="E-mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
                fullWidth
                variant="outlined"
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
                label="Senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                fullWidth
                variant="outlined"
                InputProps={{
                  sx: {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.03)'
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={!loading ? <LoginIcon /> : null}
                disabled={loading}
                fullWidth
                sx={{
                  py: 1.4,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  mt: 0.5,
                  background:
                    'linear-gradient(135deg, #FFD913 0%, #FFC43A 40%, #FFE36E 100%)',
                  color: '#070910'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>
            </Stack>

            <Stack spacing={1.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Não tem uma conta?
              </Typography>
              <Button
                color="primary"
                variant="text"
                onClick={() => navigate('/register')}
                sx={{ fontWeight: 600 }}
              >
                Criar conta grátis
              </Button>
              <Divider flexItem sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                alignItems="center"
              >
                <Chip label="+13 jogos" color="primary" variant="outlined" />
                <Chip label="Resultados sincronizados" variant="outlined" />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}

export default Login;
