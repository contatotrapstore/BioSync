import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
  School,
  People,
  Class as ClassIcon,
  Assessment,
  PersonAdd,
  GroupAdd,
  Event,
  PlayCircleFilled,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import { StatsCard } from '../../components/direction/StatsCard';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export function DirectionDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProfessores: 0,
    totalAlunos: 0,
    totalTurmas: 0,
    totalSessoes: 0,
    sessoesAtivas: 0,
    sessoesHoje: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Atualizar estatísticas em tempo real (a cada 10 segundos)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      console.log('[DirectionDashboard] Iniciando fetchStats...');

      // Contar professores
      const { count: professoresCount, error: profError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_role', 'professor')
        .eq('active', true);

      if (profError) {
        console.error('[DirectionDashboard] Erro ao contar professores:', profError);
      }

      // Contar alunos
      const { count: alunosCount, error: alunosError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_role', 'aluno')
        .eq('active', true);

      if (alunosError) {
        console.error('[DirectionDashboard] Erro ao contar alunos:', alunosError);
      }

      // Contar turmas
      const { count: turmasCount, error: turmasError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (turmasError) {
        console.error('[DirectionDashboard] Erro ao contar turmas:', turmasError);
      }

      // Contar sessões totais
      const { count: sessoesCount, error: sessoesError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      if (sessoesError) {
        console.error('[DirectionDashboard] Erro ao contar sessões:', sessoesError);
      }

      // Contar sessões ativas
      const { count: sessoesAtivasCount, error: ativasError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (ativasError) {
        console.error('[DirectionDashboard] Erro ao contar sessões ativas:', ativasError);
      }

      // Contar sessões de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const { count: sessoesHojeCount, error: hojeError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${hoje}T00:00:00`)
        .lte('created_at', `${hoje}T23:59:59`);

      if (hojeError) {
        console.error('[DirectionDashboard] Erro ao contar sessões de hoje:', hojeError);
      }

      console.log('[DirectionDashboard] Stats:', {
        professores: professoresCount,
        alunos: alunosCount,
        turmas: turmasCount,
        sessoes: sessoesCount,
        sessoesAtivas: sessoesAtivasCount,
        sessoesHoje: sessoesHojeCount,
      });

      setStats({
        totalProfessores: professoresCount || 0,
        totalAlunos: alunosCount || 0,
        totalTurmas: turmasCount || 0,
        totalSessoes: sessoesCount || 0,
        sessoesAtivas: sessoesAtivasCount || 0,
        sessoesHoje: sessoesHojeCount || 0,
      });
    } catch (error) {
      console.error('[DirectionDashboard] Erro crítico ao buscar estatísticas:', error);
    } finally {
      console.log('[DirectionDashboard] Finalizando loading...');
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Painel da Direção"
      subtitle={`Bem-vindo, ${profile?.name || 'Administrador'}`}
      breadcrumbs={[
        { label: 'Admin', path: '/admin' },
        { label: 'Dashboard', path: '/admin' },
      ]}
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando estatísticas..." />}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Professores"
            value={stats.totalProfessores}
            icon={<School />}
            color="primary"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Alunos"
            value={stats.totalAlunos}
            icon={<People />}
            color="success"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Turmas Ativas"
            value={stats.totalTurmas}
            icon={<ClassIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Sessões Totais"
            value={stats.totalSessoes}
            icon={<Assessment />}
            color="info"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Sessões Ativas"
            value={stats.sessoesAtivas}
            icon={<PlayCircleFilled />}
            color="error"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatsCard
            title="Sessões Hoje"
            value={stats.sessoesHoje}
            icon={<CalendarToday />}
            color="secondary"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card variant="elevated">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Ações Rápidas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie usuários, turmas e visualize sessões
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<PersonAdd />}
              onClick={() => navigate('/admin/users')}
              size="large"
            >
              Usuários
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<GroupAdd />}
              onClick={() => navigate('/admin/classes')}
              size="large"
            >
              Turmas
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Event />}
              onClick={() => navigate('/admin/sessions')}
              size="large"
            >
              Sessões
            </Button>
          </Grid>
        </Grid>
      </Card>
    </DashboardLayout>
  );
}
