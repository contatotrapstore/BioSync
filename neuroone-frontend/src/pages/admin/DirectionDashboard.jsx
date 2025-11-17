import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Grid, Stack, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { ThemeToggle } from '../../components/atoms/ThemeToggle';
import { StatsCard } from '../../components/direction/StatsCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export function DirectionDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProfessores: 0,
    totalAlunos: 0,
    totalTurmas: 0,
    totalSessoes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      // Contar professores
      const { count: professoresCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_role', 'professor')
        .eq('active', true);

      // Contar alunos
      const { count: alunosCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_role', 'aluno')
        .eq('active', true);

      // Contar turmas
      const { count: turmasCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Contar sessões
      const { count: sessoesCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProfessores: professoresCount || 0,
        totalAlunos: alunosCount || 0,
        totalTurmas: turmasCount || 0,
        totalSessoes: sessoesCount || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

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
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h1">
              Painel da Direção
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Bem-vindo, {profile?.name}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <ThemeToggle />
            <Button variant="outlined" onClick={handleSignOut}>
              Sair
            </Button>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total de Professores"
              value={stats.totalProfessores}
              icon="👨‍🏫"
              color="blue"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total de Alunos"
              value={stats.totalAlunos}
              icon="👥"
              color="green"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Turmas Ativas"
              value={stats.totalTurmas}
              icon="🎓"
              color="orange"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total de Sessões"
              value={stats.totalSessoes}
              icon="📊"
              color="purple"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            Ações Rápidas
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 2 }}>
            <Button variant="contained" onClick={() => navigate('/admin/users')}>
              Gerenciar Usuários
            </Button>
            <Button variant="contained" onClick={() => navigate('/admin/classes')}>
              Gerenciar Turmas
            </Button>
            <Button variant="contained" onClick={() => navigate('/admin/sessions')}>
              Ver Sessões
            </Button>
            <Button variant="outlined" onClick={() => navigate('/admin/settings')}>
              Configurações
            </Button>
            <Button variant="outlined" disabled>
              Relatórios
            </Button>
          </Stack>
        </Card>

        {/* Info Card */}
        <Card>
          <Typography variant="h3" gutterBottom>
            ✅ Dashboard Dinâmico Ativo
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            • Estatísticas atualizadas em tempo real (a cada 30s)<br />
            • Dados vindos diretamente do Supabase<br />
            • Contadores por role: {stats.totalProfessores} professores + {stats.totalAlunos} alunos<br />
            • Sistema pronto para gerenciamento completo
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            <strong>Próximas implementações (Fase 2):</strong><br />
            → CRUD completo de usuários<br />
            → CRUD completo de turmas<br />
            → Visualização de sessões com filtros<br />
            → Exportação de relatórios
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
