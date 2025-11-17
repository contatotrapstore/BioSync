import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { ThemeToggle } from '../components/atoms/ThemeToggle';

export function Home() {
  const { user, profile, role, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Redirecionar para dashboard específico baseado no role
  useEffect(() => {
    if (!loading && profile && role) {
      if (role === 'direcao') {
        navigate('/admin', { replace: true });
      } else if (role === 'professor') {
        navigate('/teacher', { replace: true });
      } else if (role === 'aluno') {
        navigate('/student', { replace: true });
      }
    }
  }, [loading, profile, role, navigate]);

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h2">Carregando...</Typography>
        </Box>
      </Container>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h1">
            NeuroOne Educacional
          </Typography>
          <ThemeToggle />
        </Box>

        <Card>
          <Typography variant="h2" gutterBottom>
            Bem-vindo, {profile?.name || user.email}!
          </Typography>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Email:
              </Typography>
              <Typography variant="body1">
                {user.email}
              </Typography>
            </Box>

            {profile?.user_role && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Função:
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {profile.user_role === 'direcao' && 'Direção'}
                  {profile.user_role === 'professor' && 'Professor'}
                  {profile.user_role === 'aluno' && 'Aluno'}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary">
                Status da Sessão:
              </Typography>
              <Typography variant="body1" color="success.main">
                ✅ Autenticado
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Button variant="outlined" onClick={handleSignOut}>
              Sair
            </Button>
          </Box>
        </Card>

        <Card sx={{ mt: 3 }}>
          <Typography variant="h3" gutterBottom>
            📊 Status do Desenvolvimento
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            • Sprint 0: Database ✅<br />
            • Semana 1: Design System ✅<br />
            • Semana 3: Autenticação ✅ (em teste)<br />
            • Próximo: Proteção de Rotas por Role
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
