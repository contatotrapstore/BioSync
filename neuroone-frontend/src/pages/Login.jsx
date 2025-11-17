import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirecionamento será feito por ProtectedRoute futuramente
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4
      }}>
        <Typography variant="h1" sx={{ mb: 1, textAlign: 'center' }}>
          NeuroOne
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
          Sistema de Neurofeedback Educacional
        </Typography>

        <Card sx={{ width: '100%' }}>
          <Typography variant="h2" sx={{ mb: 3 }}>
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </Box>
          </form>

          <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary', textAlign: 'center' }}>
            Para testes, use credenciais de desenvolvimento
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
