import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { ThemeToggle } from '../components/atoms/ThemeToggle';
import logoNeuroOnePreta from '../assets/logo-neuroone.png';
import logoNeuroOneBranca from '../assets/logo-neuroone-branca.png';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();

  // Seleciona a logo baseada no tema
  const logoNeuroOne = mode === 'dark' ? logoNeuroOneBranca : logoNeuroOnePreta;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('[Login] Tentando fazer login...');
      const data = await signIn(email, password);
      console.log('[Login] Login bem-sucedido, redirecionando...');

      // Redirecionar baseado na role
      const role = data.user?.user_metadata?.role;
      console.log('[Login] User role:', role);

      if (role === 'direcao' || role === 'direção') {
        navigate('/admin');
      } else if (role === 'professor') {
        navigate('/teacher');
      } else if (role === 'aluno') {
        navigate('/student');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('[Login] Erro no login:', err);

      // Traduzir mensagens de erro do Supabase
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

      if (err.message === 'Invalid login credentials') {
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      } else if (err.message.includes('User not found')) {
        errorMessage = 'Usuário não encontrado. Verifique o email digitado.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      px: 2,
      py: 4,
      position: 'relative'
    }}>
      {/* Theme Toggle no canto superior direito */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '500px'
      }}>
        <Box
          component="img"
          src={logoNeuroOne}
          alt="NeuroOne Logo"
          sx={{
            width: { xs: '200px', sm: '250px', md: '300px' },
            height: 'auto',
            mb: 2
          }}
        />
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
          Sistema de Neurofeedback Educacional
        </Typography>

        <Card sx={{ width: '100%', maxWidth: '500px' }}>
            <Typography variant="h2" sx={{ mb: 3, textAlign: 'center' }}>
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
      </Card>
      </Box>
    </Box>
  );
}
