import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Alert, Stack, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AttentionTimelineChart } from '../../components/teacher/AttentionTimelineChart';
import { AttentionDistributionChart } from '../../components/teacher/AttentionDistributionChart';
import { StudentPerformanceTable } from '../../components/teacher/StudentPerformanceTable';
// MUI Icons
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Home from '@mui/icons-material/Home';
import School from '@mui/icons-material/School';
import ArrowBack from '@mui/icons-material/ArrowBack';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SessionReport() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    if (user && sessionId) {
      fetchSessionReport();
    }
  }, [user, sessionId]);

  async function fetchSessionReport() {
    setLoading(true);
    try {
      // Buscar sessão
      const sessionResponse = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!sessionResponse.ok) {
        throw new Error(`HTTP ${sessionResponse.status}: ${sessionResponse.statusText}`);
      }

      const sessionResult = await sessionResponse.json();

      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Erro ao buscar sessão');
      }

      const sessionData = sessionResult.data;

      // Verificar permissão
      if (sessionData.teacher_id !== user.id) {
        setError('Você não tem permissão para acessar este relatório.');
        return;
      }

      // Verificar se sessão foi finalizada
      if (sessionData.status !== 'completed') {
        setError('Esta sessão ainda não foi finalizada.');
        return;
      }

      // Buscar dados da turma
      const classResponse = await fetch(`${API_URL}/api/classes/${sessionData.class_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (classResponse.ok) {
        const classResult = await classResponse.json();
        if (classResult.success) {
          sessionData.class = classResult.data;
        }
      }

      setSession(sessionData);

      // Buscar métricas do backend
      try {
        const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
        const response = await fetch(`${WS_URL}/api/metrics/sessions/${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const result = await response.json();

        if (result.success && result.data) {
          setMetrics(result.data);
          setUseMockData(false);
        } else {
          throw new Error('Invalid metrics response');
        }
      } catch (metricsError) {
        console.warn('Failed to load real metrics, using mock data:', metricsError);
        setUseMockData(true);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setError(error.message || 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    const diffMs = new Date(endTime) - new Date(startTime);
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  }

  // Dados mockados (fallback se backend falhar)
  const mockStudents = [
    { id: '1', name: 'Ana Silva', avgAttention: 78.5, avgRelaxation: 65.2, durationMinutes: 45 },
    { id: '2', name: 'Bruno Santos', avgAttention: 65.3, avgRelaxation: 72.1, durationMinutes: 42 },
    { id: '3', name: 'Carla Oliveira', avgAttention: 52.1, avgRelaxation: 58.9, durationMinutes: 45 },
    { id: '4', name: 'Daniel Costa', avgAttention: 35.8, avgRelaxation: 45.3, durationMinutes: 38 },
    { id: '5', name: 'Eduarda Lima', avgAttention: 88.2, avgRelaxation: 70.5, durationMinutes: 45 },
  ];

  const mockTimeline = Array.from({ length: 9 }, (_, i) => ({
    timestamp: new Date(Date.now() - (9 - i) * 5 * 60 * 1000).toISOString(),
    avgAttention: 60 + Math.random() * 20,
    minAttention: 30 + Math.random() * 20,
    maxAttention: 75 + Math.random() * 20,
  }));

  const mockDistribution = {
    low: { count: 1 },
    medium: { count: 2 },
    high: { count: 2 },
  };

  // Use real metrics if available, otherwise fallback to mock
  const students = useMockData ? mockStudents : (metrics?.students || []);
  const timeline = useMockData ? mockTimeline : (metrics?.timeline || []);
  const distribution = useMockData ? mockDistribution : (metrics?.distribution || { low: {count: 0}, medium: {count: 0}, high: {count: 0} });

  const avgAttention = useMockData
    ? mockStudents.reduce((sum, s) => sum + s.avgAttention, 0) / mockStudents.length
    : (metrics?.overall?.avgAttention || 0);

  const avgRelaxation = useMockData
    ? mockStudents.reduce((sum, s) => sum + s.avgRelaxation, 0) / mockStudents.length
    : (metrics?.overall?.avgRelaxation || 0);

  return (
    <DashboardLayout
      title="Relatório da Sessão"
      subtitle={session ? `${session.title} • ${session.class?.name}` : 'Carregando...'}
      breadcrumbs={[
        { label: 'Início', icon: <Home fontSize="small" />, href: '/' },
        { label: 'Professor', icon: <School fontSize="small" /> },
        { label: 'Relatório' },
      ]}
      actions={
        <Stack direction="row" spacing={1}>
          {session?.status === 'completed' && (
            <Chip label="Concluída" color="success" size="small" />
          )}
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/teacher')}
            disabled={loading}
          >
            Voltar
          </Button>
        </Stack>
      }
      maxWidth="lg"
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando relatório..." />}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content - Only show if not loading and no error */}
      {!loading && !error && session && (
        <>
          {/* Mock Data Warning / Real Data Success */}
          <Box sx={{ mb: 3 }}>

            {useMockData && (
              <Alert severity="warning" icon={<WarningAmberIcon />}>
                <strong>Erro ao Carregar Métricas</strong>: Os dados completos da sessão não estão disponíveis. Por favor, tente novamente mais tarde.
              </Alert>
            )}
            {!useMockData && metrics && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <strong>Métricas da Sessão</strong>: Dados de {students.length} aluno(s) processados com sucesso.
              </Alert>
            )}

        </Box>

        {/* KPIs */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {avgAttention.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Atenção Média
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <AssessmentIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {avgRelaxation.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Relaxamento Médio
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <PeopleIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {students.length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Alunos Participantes
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {formatDuration(session?.start_time, session?.end_time)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Duração
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Timeline */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Evolução da Atenção
          </Typography>
          <Card sx={{ p: 3 }}>
            <AttentionTimelineChart timelineData={timeline} height={300} />
          </Card>
        </Box>

        {/* Distribution & Table */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              Distribuição
            </Typography>
            <Card sx={{ p: 2 }}>
              <AttentionDistributionChart
                distribution={{
                  low: distribution.low.count,
                  medium: distribution.medium.count,
                  high: distribution.high.count
                }}
                height={300}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              Performance Individual
            </Typography>
            <StudentPerformanceTable students={students.map(s => ({
              id: s.studentId || s.id,
              name: s.studentName || s.name,
              avg_attention: s.avgAttention,
              avg_relaxation: s.avgRelaxation,
              duration_minutes: s.durationMinutes
            }))} />
          </Grid>
        </Grid>
        </>
      )}
    </DashboardLayout>
  );
}
