import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import EmptyState from '../../components/layout/EmptyState';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatsCard } from '../../components/direction/StatsCard';
import { TeacherClassCard } from '../../components/teacher/TeacherClassCard';
import { TeacherSessionCard } from '../../components/teacher/TeacherSessionCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
// MUI Icons
import ClassIcon from '@mui/icons-material/Class';
import People from '@mui/icons-material/People';
import Assessment from '@mui/icons-material/Assessment';
import Psychology from '@mui/icons-material/Psychology';
import Refresh from '@mui/icons-material/Refresh';
import Add from '@mui/icons-material/Add';
import Home from '@mui/icons-material/Home';
import School from '@mui/icons-material/School';

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    // Só carrega uma vez quando o user está disponível
    if (user?.id && !hasLoadedOnce) {
      fetchDashboardData();
      setHasLoadedOnce(true);
    }
  }, [user?.id]); // Usa user?.id ao invés do objeto user completo

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
      // Buscar turmas onde o professor é responsável
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
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
          const { data: sessions } = await supabase
            .from('sessions')
            .select('start_time')
            .eq('class_id', classItem.id)
            .order('start_time', { ascending: false })
            .limit(1);

          const lastSession = sessions?.[0] || null;

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
          // Removido .single() para evitar erro 406 quando não há métricas
          const { data: metricsData } = await supabase
            .from('session_metrics')
            .select('avg_attention')
            .eq('session_id', session.id)
            .limit(1);

          // Pega primeiro resultado se existir
          const metrics = metricsData && metricsData.length > 0 ? metricsData[0] : null;
          let avg_attention = metrics?.avg_attention || 0;

          // Fallback: Se não há métricas calculadas e sessão está concluída, calcula de eeg_data
          if (avg_attention === 0 && session.status === 'completed') {
            const { data: eegData } = await supabase
              .from('eeg_data')
              .select('attention')
              .eq('session_id', session.id);

            if (eegData && eegData.length > 0) {
              const sum = eegData.reduce((acc, d) => acc + (d.attention || 0), 0);
              avg_attention = sum / eegData.length;
            }
          }

          return {
            ...session,
            class_name: session.classes?.name || 'Turma não especificada',
            avg_attention,
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
        .eq('teacher_id', user.id)
        .eq('active', true);

      // Total de alunos (soma de todas as turmas)
      const { data: classIds } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id)
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
        const sessionIds = allSessions.map(s => s.id);

        // Tentar buscar de session_metrics primeiro
        const { data: metricsData } = await supabase
          .from('session_metrics')
          .select('avg_attention')
          .in('session_id', sessionIds);

        if (metricsData && metricsData.length > 0) {
          const validMetrics = metricsData.filter(m => m.avg_attention > 0);
          if (validMetrics.length > 0) {
            const sum = validMetrics.reduce((acc, m) => acc + m.avg_attention, 0);
            avgAttention = sum / validMetrics.length;
          }
        }

        // Fallback: calcular de eeg_data se session_metrics não tem dados
        if (avgAttention === 0) {
          const { data: eegData } = await supabase
            .from('eeg_data')
            .select('attention')
            .in('session_id', sessionIds);

          if (eegData && eegData.length > 0) {
            const validEeg = eegData.filter(e => e.attention != null && e.attention > 0);
            if (validEeg.length > 0) {
              const sum = validEeg.reduce((acc, e) => acc + e.attention, 0);
              avgAttention = sum / validEeg.length;
            }
          }
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

  function handleNewSession() {
    navigate('/teacher/session/create');
  }

  function handleViewClassDetails(classData) {
    navigate(`/teacher/class/${classData.id}`);
  }

  function handleViewSessionReport(session) {
    if (session.status === 'active') {
      // Navegar para página de sessão ativa
      navigate(`/teacher/session/${session.id}/active`);
    } else if (session.status === 'completed') {
      // Navegar para página de relatório
      navigate(`/teacher/session/${session.id}/report`);
    } else {
      // Para outros status, informar que não está disponível
      alert(`Esta sessão está no status: ${session.status}. Apenas sessões ativas ou concluídas podem ser visualizadas.`);
    }
  }

  return (
    <DashboardLayout
      title="Painel do Professor"
      subtitle={`Bem-vindo, ${profile?.name || 'Professor'}`}
      breadcrumbs={[
        { label: 'Professor', icon: <School fontSize="small" /> },
        { label: 'Dashboard' },
      ]}
      actions={
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewSession}
          >
            Nova Sessão
          </Button>
        </Box>
      }
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando dashboard..." />}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Minhas Turmas"
            value={stats.totalClasses}
            icon={<ClassIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total de Alunos"
            value={stats.totalStudents}
            icon={<People />}
            color="success"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Sessões no Mês"
            value={stats.sessionsThisMonth}
            icon={<Assessment />}
            color="warning"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Atenção Média"
            value={`${stats.avgAttention.toFixed(1)}%`}
            icon={<Psychology />}
            color="info"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Minhas Turmas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Minhas Turmas
        </Typography>

        {classes.length === 0 ? (
          <EmptyState
            variant="noData"
            icon={<ClassIcon sx={{ fontSize: 64 }} />}
            title="Nenhuma turma cadastrada"
            description="Solicite à direção para adicionar você como responsável por uma turma"
          />
        ) : (
          <Grid container spacing={3}>
            {classes.map((classItem) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={classItem.id}>
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
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Sessões Recentes
        </Typography>

        {recentSessions.length === 0 ? (
          <EmptyState
            variant="noData"
            icon={<Assessment sx={{ fontSize: 64 }} />}
            title="Nenhuma sessão realizada"
            description="Inicie sua primeira sessão para começar a acompanhar o desempenho dos alunos"
            actionLabel="Iniciar Primeira Sessão"
            onAction={handleNewSession}
          />
        ) : (
          <Grid container spacing={3}>
            {recentSessions.map((session) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={session.id}>
                <TeacherSessionCard
                  session={session}
                  onViewReport={handleViewSessionReport}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}
