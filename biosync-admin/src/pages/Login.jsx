import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { setAuthData } from '../utils/auth';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const { token, refreshToken, user } = await authAPI.login(formData);
      setAuthData(token, refreshToken, user);
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ocorreu um erro durante o login');
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
        background:
          'linear-gradient(135deg, #1c1400 0%, #d4a100 55%, #ffd913 100%)'
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={10} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img
                src="/logo-neuroone.png"
                alt="NeuroOne"
                style={{ width: '200px', marginBottom: '16px' }}
              />
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight="bold"
                sx={{ color: '#c7a300' }}
              >
                Painel Administrativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Faça login para acessar o painel administrativo
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="E-mail ou Username"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                autoComplete="username"
                autoFocus
                disabled={loading}
                helperText="Digite seu e-mail ou username"
              />

              <TextField
                fullWidth
                label="Senha"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                autoComplete="current-password"
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  bgcolor: '#ffd913',
                  '&:hover': {
                    bgcolor: '#e6c700'
                  }
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;




