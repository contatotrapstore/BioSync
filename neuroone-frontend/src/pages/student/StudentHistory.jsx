import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import EmptyState from '../../components/layout/EmptyState';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { generateSessionReport, generateStudentSummary } from '../../utils/pdfExport';
// MUI Icons
import DownloadIcon from '@mui/icons-material/Download';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Home from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export function StudentHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'month', 'week'
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadSessionHistory();
  }, [filter]);

  async function loadSessionHistory() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Você precisa estar logado para ver o histórico.');
        setLoading(false);
        return;
      }

      // Calculate date filter
      let startDate = new Date(0); // Default: all time
      if (filter === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (filter === 'month') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Fetch session participants for this student
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('student_id', user.id)
        .gte('joined_at', startDate.toISOString())
        .order('joined_at', { ascending: false })
        .limit(50);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      if (!participantsData || participantsData.length === 0) {
        setSessions([]);
        setStats(null);
        return;
      }

      // Get unique session IDs
      const sessionIds = [...new Set(participantsData.map(p => p.session_id))];

      // Fetch session details
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, title, start_time, end_time, class_id')
        .in('id', sessionIds);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      // Fetch student metrics for these sessions
      const { data: metricsData, error: metricsError } = await supabase
        .from('student_metrics')
        .select('session_id, avg_attention, avg_relaxation, max_attention, engagement_score')
        .eq('student_id', user.id)
        .in('session_id', sessionIds);

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        // Don't throw - metrics are optional, continue without them
      }

      // Fetch class details if there are class_ids
      const classIds = [...new Set(sessionsData.filter(s => s.class_id).map(s => s.class_id))];
      let classesData = [];

      if (classIds.length > 0) {
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id, name')
          .in('id', classIds);

        if (!classesError && classes) {
          classesData = classes;
        }
      }

      // Combine all data
      const combinedData = participantsData.map(participant => {
        const session = sessionsData.find(s => s.id === participant.session_id);
        const metrics = metricsData ? metricsData.find(m => m.session_id === participant.session_id) : null;
        const classInfo = session && session.class_id
          ? classesData.find(c => c.id === session.class_id)
          : null;

        return {
          ...participant,
          // Add metrics data
          avg_attention: metrics?.avg_attention || 0,
          avg_relaxation: metrics?.avg_relaxation || 0,
          max_attention: metrics?.max_attention || 0,
          engagement_score: metrics?.engagement_score || 0,
          session: session ? {
            ...session,
            class: classInfo ? { name: classInfo.name } : null
          } : null
        };
      }).filter(item => item.session);

      setSessions(combinedData);

      // Calculate statistics
      if (combinedData && combinedData.length > 0) {
        const avgAttention =
          combinedData.reduce((sum, s) => sum + (s.avg_attention || 0), 0) / combinedData.length;
        const avgRelaxation =
          combinedData.reduce((sum, s) => sum + (s.avg_relaxation || 0), 0) / combinedData.length;
        const totalScore = combinedData.reduce((sum, s) => sum + (s.engagement_score || 0), 0);
        const maxAttention = Math.max(...combinedData.map((s) => s.max_attention || 0));
        const maxRelaxation = Math.max(...combinedData.map((s) => s.avg_relaxation || 0));

        setStats({
          avgAttention: avgAttention.toFixed(1),
          avgRelaxation: avgRelaxation.toFixed(1),
          totalScore: totalScore.toFixed(1),
          maxAttention,
          maxRelaxation: maxRelaxation.toFixed(1),
          totalSessions: combinedData.length,
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico de sessões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleExportSession(session) {
    const {
      data: { user },
    } = supabase.auth.getUser();

    user.then((userData) => {
      if (userData.user) {
        const studentInfo = {
          name: userData.user.user_metadata?.name || userData.user.email,
          email: userData.user.email,
        };

        generateSessionReport(session.session, session, studentInfo);
      }
    });
  }

  function handleExportAll() {
    const {
      data: { user },
    } = supabase.auth.getUser();

    user.then((userData) => {
      if (userData.user) {
        const studentInfo = {
          name: userData.user.user_metadata?.name || userData.user.email,
          email: userData.user.email,
        };

        const sessionsWithMetrics = sessions.map((s) => ({
          ...s.session,
          metrics: s,
        }));

        generateStudentSummary(sessionsWithMetrics, studentInfo);
      }
    });
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatDuration(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes} min`;
  }

  return (
    <DashboardLayout
      title="Histórico de Sessões"
      subtitle="Acompanhe seu progresso e desempenho nas sessões"
      breadcrumbs={[
        { label: 'Aluno', icon: <SchoolIcon fontSize="small" /> },
        { label: 'Histórico', icon: <TimelineIcon fontSize="small" /> },
      ]}
      actions={
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/student')}
            size="small"
          >
            Voltar
          </Button>
          {sessions.length > 0 && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportAll}
              size="small"
            >
              Exportar Histórico
            </Button>
          )}
        </Stack>
      }
      maxWidth="lg"
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando histórico..." />}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Sessões Totais
                  </Typography>
                  <Typography variant="h4">{stats.totalSessions}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Atenção Média
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.avgAttention}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Relaxamento Médio
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {stats.avgRelaxation}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pontuação Total
                  </Typography>
                  <Typography variant="h4">{stats.totalScore || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <Chip
            label="Todos"
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Último Mês"
            onClick={() => setFilter('month')}
            color={filter === 'month' ? 'primary' : 'default'}
            variant={filter === 'month' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Última Semana"
            onClick={() => setFilter('week')}
            color={filter === 'week' ? 'primary' : 'default'}
            variant={filter === 'week' ? 'filled' : 'outlined'}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <EmptyState
            variant="noData"
            icon={<TimelineIcon sx={{ fontSize: 64 }} />}
            title="Nenhuma sessão encontrada"
            description="Nenhuma sessão encontrada para o período selecionado. Participe de uma sessão para ver seu histórico aqui!"
          />
        ) : (
          <Grid container spacing={2}>
            {sessions.map((sessionData, index) => (
              <Grid item xs={12} md={6} key={sessionData.id || index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {sessionData.session?.title || 'Sessão de Neurofeedback'}
                    </Typography>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventIcon fontSize="small" />
                        {formatDate(sessionData.session?.start_time)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" />
                        Duração: {formatDuration(sessionData.session?.start_time, sessionData.session?.end_time)}
                      </Typography>
                      {sessionData.session?.class && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BusinessIcon fontSize="small" />
                          Turma: {sessionData.session.class.name}
                        </Typography>
                      )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Atenção
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {sessionData.avg_attention || 0}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pico: {sessionData.max_attention || 0}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Relaxamento
                        </Typography>
                        <Typography variant="h6" color="secondary">
                          {sessionData.avg_relaxation || 0}%
                        </Typography>
                      </Grid>
                      {sessionData.game_score && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Pontuação do Jogo
                          </Typography>
                          <Typography variant="h6">
                            <TrendingUpIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {sessionData.game_score} pontos
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportSession(sessionData)}
                    >
                      Exportar Relatório
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
    </DashboardLayout>
  );
}
