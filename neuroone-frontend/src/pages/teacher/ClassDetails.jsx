import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import EmptyState from '../../components/layout/EmptyState';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatsCard } from '../../components/direction/StatsCard';
import { supabase } from '../../services/supabase';
// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventIcon from '@mui/icons-material/Event';
import Home from '@mui/icons-material/Home';
import ClassIcon from '@mui/icons-material/Class';

export function ClassDetails() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    avgAttention: 0,
    avgRelaxation: 0,
  });

  useEffect(() => {
    if (classId && user) {
      loadClassDetails();
    }
  }, [classId, user]);

  async function loadClassDetails() {
    setLoading(true);
    try {
      await Promise.all([
        fetchClassInfo(),
        fetchStudents(),
        fetchSessions(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar detalhes da turma:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClassInfo() {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) throw error;
      setClassData(data);
    } catch (error) {
      console.error('Erro ao buscar informações da turma:', error);
    }
  }

  async function fetchStudents() {
    try {
      // Buscar IDs dos alunos da turma
      const { data: classStudents, error: classError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      if (classError) throw classError;

      if (!classStudents || classStudents.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = classStudents.map(cs => cs.student_id);

      // Buscar informações dos alunos
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Para cada aluno, buscar métricas de desempenho
      const studentsWithMetrics = await Promise.all(
        (studentsData || []).map(async (student) => {
          // Buscar sessões do aluno nesta turma
          const { data: studentSessions } = await supabase
            .from('session_participants')
            .select('session_id')
            .eq('student_id', student.id);

          const sessionCount = studentSessions?.length || 0;

          // Buscar métricas médias
          if (sessionCount > 0) {
            const sessionIds = studentSessions.map(sp => sp.session_id);

            const { data: metrics } = await supabase
              .from('session_participants')
              .select('avg_attention, avg_relaxation')
              .eq('student_id', student.id)
              .in('session_id', sessionIds);

            const avgAttention = metrics?.length > 0
              ? metrics.reduce((sum, m) => sum + (m.avg_attention || 0), 0) / metrics.length
              : 0;

            const avgRelaxation = metrics?.length > 0
              ? metrics.reduce((sum, m) => sum + (m.avg_relaxation || 0), 0) / metrics.length
              : 0;

            return {
              ...student,
              name: student.name || student.email,
              sessionCount,
              avgAttention: avgAttention.toFixed(1),
              avgRelaxation: avgRelaxation.toFixed(1),
            };
          }

          return {
            ...student,
            name: student.name || student.email,
            sessionCount: 0,
            avgAttention: 0,
            avgRelaxation: 0,
          };
        })
      );

      setStudents(studentsWithMetrics);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  }

  async function fetchSessions() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('class_id', classId)
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Para cada sessão, contar participantes
      const sessionsWithDetails = await Promise.all(
        (data || []).map(async (session) => {
          const { count } = await supabase
            .from('session_participants')
            .select('student_id', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            participantCount: count || 0,
          };
        })
      );

      setSessions(sessionsWithDetails);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
    }
  }

  async function fetchStats() {
    try {
      // Total de alunos
      const { count: totalStudents } = await supabase
        .from('class_students')
        .select('student_id', { count: 'exact', head: true })
        .eq('class_id', classId);

      // Total de sessões
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      // Buscar todas as sessões da turma
      const { data: classSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('class_id', classId);

      let avgAttention = 0;
      let avgRelaxation = 0;

      if (classSessions && classSessions.length > 0) {
        const sessionIds = classSessions.map(s => s.id);

        const { data: allMetrics } = await supabase
          .from('session_participants')
          .select('avg_attention, avg_relaxation')
          .in('session_id', sessionIds);

        if (allMetrics && allMetrics.length > 0) {
          avgAttention = allMetrics.reduce((sum, m) => sum + (m.avg_attention || 0), 0) / allMetrics.length;
          avgRelaxation = allMetrics.reduce((sum, m) => sum + (m.avg_relaxation || 0), 0) / allMetrics.length;
        }
      }

      setStats({
        totalStudents: totalStudents || 0,
        totalSessions: totalSessions || 0,
        avgAttention,
        avgRelaxation,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Detalhes da Turma">
        <LoadingOverlay variant="section" message="Carregando detalhes da turma..." />
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout title="Detalhes da Turma">
        <Alert severity="error">Turma não encontrada</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={classData.name}
      subtitle={classData.description || 'Detalhes e estatísticas da turma'}
      breadcrumbs={[
        { label: 'Início', icon: <Home fontSize="small" />, href: '/' },
        { label: 'Professor', icon: <SchoolIcon fontSize="small" />, href: '/teacher' },
        { label: 'Turma', icon: <ClassIcon fontSize="small" /> },
      ]}
      actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher')}
        >
          Voltar
        </Button>
      }
      maxWidth="xl"
    >
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total de Alunos"
            value={stats.totalStudents}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Sessões Realizadas"
            value={stats.totalSessions}
            icon={<AssessmentIcon />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Atenção Média"
            value={`${stats.avgAttention.toFixed(1)}%`}
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Relaxamento Médio"
            value={`${stats.avgRelaxation.toFixed(1)}%`}
            icon={<TrendingUpIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab label={`Alunos (${students.length})`} icon={<PeopleIcon />} iconPosition="start" />
          <Tab label={`Sessões (${sessions.length})`} icon={<AssessmentIcon />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Lista de Alunos
            </Typography>

            {students.length === 0 ? (
              <EmptyState
                variant="noData"
                icon={<PeopleIcon sx={{ fontSize: 64 }} />}
                title="Nenhum aluno cadastrado"
                description="Esta turma ainda não possui alunos matriculados"
              />
            ) : (
              <List>
                {students.map((student, index) => (
                  <React.Fragment key={student.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        py: 2,
                        px: 0,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={600}>
                            {student.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {student.email}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Chip
                                size="small"
                                label={`${student.sessionCount} sessões`}
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`Atenção: ${student.avgAttention}%`}
                                color="success"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`Relaxamento: ${student.avgRelaxation}%`}
                                color="info"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Histórico de Sessões
            </Typography>

            {sessions.length === 0 ? (
              <EmptyState
                variant="noData"
                icon={<AssessmentIcon sx={{ fontSize: 64 }} />}
                title="Nenhuma sessão realizada"
                description="Esta turma ainda não possui sessões de neurofeedback"
              />
            ) : (
              <List>
                {sessions.map((session, index) => (
                  <React.Fragment key={session.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        py: 2,
                        px: 0,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {session.title || 'Sessão de Neurofeedback'}
                            </Typography>
                            <Chip
                              size="small"
                              label={getStatusLabel(session.status)}
                              color={getStatusColor(session.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Data: {formatDate(session.start_time)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Participantes: {session.participantCount} alunos
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Card>
      )}
    </DashboardLayout>
  );
}
