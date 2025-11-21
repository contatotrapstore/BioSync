import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  LinearProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import EmptyState from '../../components/layout/EmptyState';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../services/supabase';
// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function StudentDetail() {
  const { studentId } = useParams();
  const { user, role: userRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [overallMetrics, setOverallMetrics] = useState({
    totalSessions: 0,
    avgAttention: 0,
    avgRelaxation: 0,
    minAttention: 0,
    maxAttention: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  async function fetchStudentData() {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select('id, name, email, cpf')
        .eq('id', studentId)
        .eq('user_role', 'aluno')
        .single();

      if (studentError) throw studentError;
      if (!studentData) {
        setError('Aluno não encontrado.');
        return;
      }

      setStudent(studentData);

      // 2. Fetch all sessions the student participated in
      const { data: participations, error: participationsError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('student_id', studentId);

      if (participationsError) throw participationsError;

      const sessionIds = participations?.map(p => p.session_id) || [];

      if (sessionIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Fetch session details
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, title, start_time, end_time, status, classes(name)')
        .in('id', sessionIds)
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      // 4. Fetch student metrics for each session
      const { data: metricsData, error: metricsError } = await supabase
        .from('student_metrics')
        .select('session_id, avg_attention, avg_relaxation, min_attention, max_attention')
        .eq('student_id', studentId)
        .in('session_id', sessionIds);

      if (metricsError) throw metricsError;

      // Merge sessions with metrics
      const sessionsWithMetrics = (sessionsData || []).map(session => {
        const metric = metricsData?.find(m => m.session_id === session.id);
        return {
          ...session,
          class_name: session.classes?.name || 'Turma não especificada',
          avg_attention: metric?.avg_attention || 0,
          avg_relaxation: metric?.avg_relaxation || 0,
          min_attention: metric?.min_attention || 0,
          max_attention: metric?.max_attention || 0,
        };
      });

      setSessions(sessionsWithMetrics);

      // 5. Calculate overall metrics
      const validMetrics = sessionsWithMetrics.filter(s => s.avg_attention > 0);

      if (validMetrics.length > 0) {
        const avgAttention = validMetrics.reduce((sum, s) => sum + s.avg_attention, 0) / validMetrics.length;
        const avgRelaxation = validMetrics.reduce((sum, s) => sum + s.avg_relaxation, 0) / validMetrics.length;
        const minAttention = Math.min(...validMetrics.map(s => s.min_attention));
        const maxAttention = Math.max(...validMetrics.map(s => s.max_attention));

        setOverallMetrics({
          totalSessions: sessionsWithMetrics.length,
          avgAttention: parseFloat(avgAttention.toFixed(2)),
          avgRelaxation: parseFloat(avgRelaxation.toFixed(2)),
          minAttention,
          maxAttention,
        });
      } else {
        setOverallMetrics({
          totalSessions: sessionsWithMetrics.length,
          avgAttention: 0,
          avgRelaxation: 0,
          minAttention: 0,
          maxAttention: 0,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar dados do aluno:', err);
      setError('Erro ao carregar dados do aluno.');
    } finally {
      setLoading(false);
    }
  }

  function getAttentionColor(attention) {
    if (attention >= 70) return 'success';
    if (attention >= 40) return 'warning';
    return 'error';
  }

  function getAttentionLevel(attention) {
    if (attention >= 70) return 'Alta';
    if (attention >= 40) return 'Média';
    return 'Baixa';
  }

  function handleSessionClick(sessionId) {
    navigate(`/teacher/session/${sessionId}/report`);
  }

  if (loading) {
    return (
      <DashboardLayout title="Detalhes do Aluno">
        <LoadingOverlay variant="section" message="Carregando dados do aluno..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Detalhes do Aluno">
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Voltar
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Detalhes do Aluno: ${student?.name || 'Carregando...'}`}
      subtitle="Visualização completa do desempenho individual"
      breadcrumbs={[
        { label: 'Dashboard', path: userRole === 'professor' ? '/teacher' : '/admin' },
        { label: 'Detalhes do Aluno' },
      ]}
      actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      }
      maxWidth="lg"
    >
      {/* Student Info Card */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h2" sx={{ mb: 0.5 }}>
              {student?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {student?.email}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Overall Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Total de Sessões
            </Typography>
            <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700 }}>
              {overallMetrics.totalSessions}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Atenção Média
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: '2rem', fontWeight: 700, color: 'primary.main' }}
            >
              {overallMetrics.avgAttention.toFixed(1)}%
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Atenção Mínima
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: '2rem', fontWeight: 700, color: 'error.main' }}
            >
              {overallMetrics.minAttention}%
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Atenção Máxima
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: '2rem', fontWeight: 700, color: 'success.main' }}
            >
              {overallMetrics.maxAttention}%
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions Table */}
      <Card>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography variant="h2" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            Histórico de Sessões
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Todas as sessões que o aluno participou
          </Typography>
        </Box>

        {sessions.length === 0 ? (
          <EmptyState
            variant="noData"
            icon={<AssessmentIcon sx={{ fontSize: 64 }} />}
            title="Nenhuma sessão encontrada"
            description="Este aluno ainda não participou de nenhuma sessão"
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Turma</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Atenção Média</TableCell>
                  <TableCell>Relaxamento Médio</TableCell>
                  <TableCell>Nível</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {session.title || 'Sem título'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{session.class_name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {new Date(session.start_time).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={session.status === 'active' ? 'Ativa' : 'Finalizada'}
                        color={session.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 50 }}>
                          {session.avg_attention.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={session.avg_attention}
                          color={getAttentionColor(session.avg_attention)}
                          sx={{ flex: 1, minWidth: 60 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {session.avg_relaxation.toFixed(1)}%
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getAttentionLevel(session.avg_attention)}
                        color={getAttentionColor(session.avg_attention)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </DashboardLayout>
  );
}
