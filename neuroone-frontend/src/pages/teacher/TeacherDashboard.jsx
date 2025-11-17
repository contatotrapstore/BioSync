import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Grid, Stack, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { ThemeToggle } from '../../components/atoms/ThemeToggle';
import { StatsCard } from '../../components/direction/StatsCard';
import { TeacherClassCard } from '../../components/teacher/TeacherClassCard';
import { TeacherSessionCard } from '../../components/teacher/TeacherSessionCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export function TeacherDashboard() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    sessionsThisMonth: 0,
    avgAttention: 0,
  });
  const [classes, setClasses] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchRecentSessions(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClasses() {
    try {
      // Buscar turmas criadas pelo professor
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('created_by', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada turma, buscar última sessão e contagem de alunos
      const classesWithDetails = await Promise.all(
        (classesData || []).map(async (classItem) => {
          // Contar alunos
          const { count: studentCount } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id);

          // Buscar última sessão
          const { data: lastSession } = await supabase
            .from('sessions')
            .select('start_time')
            .eq('class_id', classItem.id)
            .order('start_time', { ascending: false })
            .limit(1)
            .single();

          return {
            ...classItem,
            student_count: studentCount || 0,
            last_session_date: lastSession?.start_time || null,
          };
        })
      );

      setClasses(classesWithDetails);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
    }
  }

  async function fetchRecentSessions() {
    try {
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select(`
          *,
          classes(name)
        `)
        .eq('teacher_id', user.id)
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Para cada sessão, buscar métricas
      const sessionsWithMetrics = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: metricsData } = await supabase
            .from('session_metrics')
            .select('avg_attention')
            .eq('session_id', session.id)
            .single();

          return {
            ...session,
            class_name: session.classes?.name || 'Turma não especificada',
            avg_attention: metricsData?.avg_attention || 0,
          };
        })
      );

      setRecentSessions(sessionsWithMetrics);
    } catch (error) {
      console.error('Erro ao buscar sessões recentes:', error);
    }
  }

  async function fetchStats() {
    try {
      // Total de turmas
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('active', true);

      // Total de alunos (soma de todas as turmas)
      const { data: classIds } = await supabase
        .from('classes')
        .select('id')
        .eq('created_by', user.id)
        .eq('active', true);

      let totalStudents = 0;
      if (classIds && classIds.length > 0) {
        const { count: studentsCount } = await supabase
          .from('class_students')
          .select('student_id', { count: 'exact', head: true })
          .in('class_id', classIds.map(c => c.id));

        totalStudents = studentsCount || 0;
      }

      // Sessões do mês atual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count: sessionsThisMonth } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .gte('start_time', firstDayOfMonth);

      // Atenção média de todas as sessões
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('teacher_id', user.id);

      let avgAttention = 0;
      if (allSessions && allSessions.length > 0) {
        const { data: metricsData } = await supabase
          .from('session_metrics')
          .select('avg_attention')
          .in('session_id', allSessions.map(s => s.id));

        if (metricsData && metricsData.length > 0) {
          const sum = metricsData.reduce((acc, m) => acc + (m.avg_attention || 0), 0);
          avgAttention = sum / metricsData.length;
        }
      }

      setStats({
        totalClasses: totalClasses || 0,
        totalStudents,
        sessionsThisMonth: sessionsThisMonth || 0,
        avgAttention,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
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

  function handleNewSession() {
    navigate('/teacher/session/create');
  }

  function handleViewClassDetails(classData) {
    // TODO: Navegar para página de detalhes da turma
    alert(`Ver detalhes da turma: ${classData.name}`);
  }

  function handleViewSessionReport(session) {
    // TODO: Navegar para página de relatório ou sessão ativa
    if (session.status === 'active') {
      alert(`Entrar na sessão ativa: ${session.title}`);
    } else {
      alert(`Ver relatório da sessão: ${session.title}`);
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
              Painel do Professor
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
              title="Minhas Turmas"
              value={stats.totalClasses}
              icon="👨‍🏫"
              color="blue"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total de Alunos"
              value={stats.totalStudents}
              icon="👥"
              color="green"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Sessões no Mês"
              value={stats.sessionsThisMonth}
              icon="📊"
              color="orange"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Atenção Média"
              value={`${stats.avgAttention.toFixed(1)}%`}
              icon="🎯"
              color="purple"
            />
          </Grid>
        </Grid>

        {/* Botão Destacado - Nova Sessão */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" sx={{ color: 'white', mb: 2 }}>
              Pronto para iniciar uma nova sessão?
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleNewSession}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              + Iniciar Nova Sessão
            </Button>
          </Box>
        </Card>

        {/* Minhas Turmas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ mb: 3 }}>
            Minhas Turmas
          </Typography>

          {classes.length === 0 ? (
            <Card>
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ mb: 2, color: 'text.secondary' }}>
                  📚 Nenhuma turma cadastrada
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Solicite à direção para adicionar você como responsável por uma turma
                </Typography>
              </Box>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {classes.map((classItem) => (
                <Grid item xs={12} sm={6} md={4} key={classItem.id}>
                  <TeacherClassCard
                    classData={classItem}
                    onViewDetails={handleViewClassDetails}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Sessões Recentes */}
        <Box>
          <Typography variant="h2" sx={{ mb: 3 }}>
            Sessões Recentes
          </Typography>

          {recentSessions.length === 0 ? (
            <Card>
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ mb: 2, color: 'text.secondary' }}>
                  📊 Nenhuma sessão realizada
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  Inicie sua primeira sessão para começar a acompanhar o desempenho dos alunos
                </Typography>
                <Button variant="contained" onClick={handleNewSession}>
                  Iniciar Primeira Sessão
                </Button>
              </Box>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {recentSessions.map((session) => (
                <Grid item xs={12} sm={6} md={4} key={session.id}>
                  <TeacherSessionCard
                    session={session}
                    onViewReport={handleViewSessionReport}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  );
}
