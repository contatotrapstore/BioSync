import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Button } from '../../components/atoms/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { generateSessionReport, generateStudentSummary } from '../../utils/pdfExport';
import DownloadIcon from '@mui/icons-material/Download';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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

      // Fetch session metrics for this student
      const { data, error: fetchError } = await supabase
        .from('session_metrics')
        .select(
          `
          *,
          session:sessions!inner(
            id,
            title,
            started_at,
            ended_at,
            class:classes(name)
          )
        `
        )
        .eq('student_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setSessions(data || []);

      // Calculate statistics
      if (data && data.length > 0) {
        const avgAttention =
          data.reduce((sum, s) => sum + (s.avg_attention || 0), 0) / data.length;
        const avgRelaxation =
          data.reduce((sum, s) => sum + (s.avg_relaxation || 0), 0) / data.length;
        const totalScore = data.reduce((sum, s) => sum + (s.game_score || 0), 0);
        const maxAttention = Math.max(...data.map((s) => s.peak_attention || 0));
        const maxRelaxation = Math.max(...data.map((s) => s.peak_relaxation || 0));

        setStats({
          avgAttention: avgAttention.toFixed(1),
          avgRelaxation: avgRelaxation.toFixed(1),
          totalScore,
          maxAttention,
          maxRelaxation,
          totalSessions: data.length,
        });
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Carregando histórico...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h1" sx={{ mb: 0 }}>
            <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Histórico de Sessões
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/student')}>
            Voltar ao Dashboard
          </Button>
        </Box>

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
          <Box sx={{ flexGrow: 1 }} />
          {sessions.length > 0 && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportAll}
              size="small"
            >
              Exportar Histórico Completo
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Alert severity="info">
            Nenhuma sessão encontrada para o período selecionado. Participe de uma sessão para ver
            seu histórico aqui!
          </Alert>
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
                      <Typography variant="body2" color="text.secondary">
                        📅 {formatDate(sessionData.session?.started_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ⏱️ Duração:{' '}
                        {formatDuration(sessionData.session?.started_at, sessionData.session?.ended_at)}
                      </Typography>
                      {sessionData.session?.class && (
                        <Typography variant="body2" color="text.secondary">
                          🏫 Turma: {sessionData.session.class.name}
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
                          Pico: {sessionData.peak_attention || 0}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Relaxamento
                        </Typography>
                        <Typography variant="h6" color="secondary">
                          {sessionData.avg_relaxation || 0}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pico: {sessionData.peak_relaxation || 0}%
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
      </Box>
    </Container>
  );
}
