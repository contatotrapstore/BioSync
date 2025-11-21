import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Alert, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/atoms/Button';
import { Card } from '../../components/atoms/Card';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import EmptyState from '../../components/layout/EmptyState';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../services/supabase';
// MUI Icons
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiIcon from '@mui/icons-material/Wifi';
import Home from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import Refresh from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { StudentSession } from './StudentSession';
import { StudentHistory } from './StudentHistory';
import { StudentSettings } from './StudentSettings';

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchActiveSessions();
    }
  }, [user]);

  // Realtime subscription for active sessions
  useEffect(() => {
    if (!user) return;

    // Subscribe to sessions table changes
    const channel = supabase
      .channel('student-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'sessions',
          filter: `status=eq.active`,
        },
        (payload) => {
          console.log('[Realtime] Session change detected:', payload);
          // Refetch active sessions when any change occurs (without loading spinner)
          fetchActiveSessions(false);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Polling as fallback (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const pollingInterval = setInterval(() => {
      fetchActiveSessions(false); // Poll without showing loading
    }, 30000); // 30 seconds

    return () => clearInterval(pollingInterval);
  }, [user]);

  async function fetchActiveSessions(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }
    try {
      // Buscar turmas do aluno
      const { data: classStudents, error: classError } = await supabase
        .from('class_students')
        .select(`class_id, class:classes(id, name, school_year)`)
        .eq('student_id', user.id);

      if (classError) throw classError;

      const classIds = classStudents.map((cs) => cs.class_id);

      if (classIds.length === 0) {
        setActiveSessions([]);
        setError(null);
        return;
      }

      // Buscar sessões ativas
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`*, class:classes(id, name, school_year), teacher:users!teacher_id(id, name)`)
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      setActiveSessions(sessions || []);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      setError(error.message || 'Erro ao carregar sessões ativas.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardLayout
            title="Painel do Aluno"
            subtitle={`Bem-vindo, ${user?.name || 'Aluno'}!`}
            breadcrumbs={[
              { label: 'Aluno', icon: <SchoolIcon fontSize="small" /> },
              { label: 'Dashboard' },
            ]}
            actions={
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchActiveSessions}
                disabled={loading}
              >
                Atualizar
              </Button>
            }
          >
            {/* Loading Overlay */}
            {loading && <LoadingOverlay variant="section" message="Carregando sessões..." />}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Sessões Ativas */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Sessões Ativas
              </Typography>

              {activeSessions.length === 0 ? (
                <EmptyState
                  variant="noData"
                  icon={<WifiIcon sx={{ fontSize: 64 }} />}
                  title="Nenhuma sessão ativa"
                  description="Aguarde seu professor iniciar uma sessão de neurofeedback"
                />
              ) : (
                <Grid container spacing={3}>
                  {activeSessions.map((session) => (
                    <Grid size={{ xs: 12, md: 6 }} key={session.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderColor: 'primary.main',
                          borderWidth: 2,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                          },
                        }}
                      >
                        <Box sx={{ p: 3 }}>
                          {/* Status Badge */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              icon={<WifiIcon />}
                              label="Ao Vivo"
                              color="success"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(session.start_time).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>

                          {/* Session Info */}
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {session.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            {session.class?.name} • {session.class?.school_year}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Professor: {session.teacher?.name}
                          </Typography>

                          {/* Game Badge */}
                          {session.game_id && (
                            <Chip
                              icon={<SportsEsportsIcon />}
                              label={`Jogo: ${session.game_id}`}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 2 }}
                            />
                          )}

                          {/* Action Button */}
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => navigate(`/student/session/${session.id}`)}
                          >
                            Entrar na Sessão
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            {/* Ações Rápidas */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Ações Rápidas
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    clickable
                    onClick={() => navigate('/student/history')}
                    sx={{ textAlign: 'center', py: 4 }}
                  >
                    <AssessmentIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      Histórico
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ver sessões passadas e seu progresso
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    clickable
                    onClick={() => navigate('/student/settings')}
                    sx={{ textAlign: 'center', py: 4 }}
                  >
                    <SettingsIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      Configurações
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configurar dispositivo EEG
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Info Alert */}
            <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Como Funciona
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                <li>
                  <Typography variant="body2">
                    Aguarde seu professor iniciar uma sessão
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Entre na sessão clicando em "Entrar na Sessão"
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Conecte seu dispositivo EEG quando solicitado
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Jogue e melhore sua atenção!
                  </Typography>
                </li>
              </Box>
            </Alert>
          </DashboardLayout>
        }
      />
      <Route path="/session/:sessionId" element={<StudentSession />} />
      <Route path="/history" element={<StudentHistory />} />
      <Route path="/settings" element={<StudentSettings />} />
    </Routes>
  );
}
