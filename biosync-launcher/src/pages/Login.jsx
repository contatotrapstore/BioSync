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
  alpha,
  useTheme,
  Link
} from '@mui/material';
import { Login as LoginIcon, VpnKey } from '@mui/icons-material';
import api from '../services/api';
import { setStoredToken, setStoredUser } from '../services/storage';
import logoUrl from '../assets/logo-branca.png';

function Login({ onLogin }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Preencha email e senha');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { token, user } = response.data.data;

      await setStoredToken(token);
      await setStoredUser(user);

      onLogin();
      navigate('/library');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Email ou senha incorretos. Tente novamente.');
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
        backgroundColor: '#0a0d1a',
        backgroundImage:
          'radial-gradient(circle at 25% 20%, rgba(13,27,166,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(10,13,26,0.8), transparent 55%)',
        px: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 960,
          borderRadius: 4,
          overflow: 'hidden',
          display: { xs: 'block', md: 'flex' },
          border: '1px solid rgba(30,61,217,0.25)'
        }}
      >
        <Box
          sx={{
            flex: 1,
            backgroundImage: theme.palette?.gradient?.primary,
            p: { xs: 4, md: 6 },
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
              <Box
                component="img"
                src={logoUrl}
                alt="BioSync Logo"
                sx={{ height: 48, width: 'auto' }}
              />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '0.16em' }}>
                  BIOSYNC
                </Typography>
                <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.8) }}>
                  Plataforma de jogos neuroeducacionais
                </Typography>
              </Box>
            </Stack>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Bem-vindo de volta!
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.76), mb: 4 }}>
              Acesse sua biblioteca e continue seus treinamentos personalizados.
            </Typography>

            <Stack spacing={3} sx={{ color: alpha('#ffffff', 0.8) }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  +13 jogos
                </Typography>
                <Typography variant="caption">Coleção focada em habilidades cognitivas</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Monitoramento inteligente
                </Typography>
                <Typography variant="caption">Resultados sincronizados com sua conta BioSync</Typography>
              </Box>
            </Stack>
          </Box>

          <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.65) }}>
            © {new Date().getFullYear()} BioSync. Todos os direitos reservados.
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            p: { xs: 4, md: 6 },
            background: 'linear-gradient(160deg, rgba(10,13,26,0.95) 0%, rgba(13,18,32,0.95) 100%)'
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Entrar na conta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use seu email e senha para acessar sua conta BioSync
              </Typography>
            </Box>

            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                size="medium"
                placeholder="seu@email.com"
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
                size="medium"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={!loading ? <LoginIcon /> : null}
                disabled={loading}
                sx={{ py: 1.3, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Não tem uma conta?
              </Typography>
              <Link
                component="button"
                onClick={() => navigate('/register')}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Criar conta grátis
              </Link>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
