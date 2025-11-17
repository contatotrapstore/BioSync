import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card as MuiCard,
  CardContent,
  CardActions,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/atoms/Button';
import { supabase } from '../../services/supabase';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiIcon from '@mui/icons-material/Wifi';
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

  async function fetchActiveSessions() {
    setLoading(true);
    try {
      // Buscar turmas do aluno
      const { data: classStudents, error: classError } = await supabase
        .from('class_students')
        .select(`class_id, class:classes(id, name, school_year)`)
        .eq('student_id', user.id);

      if (classError) throw classError;

      const classIds = classStudents.map((cs) => cs.class_id);

      // Buscar sessões ativas
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`*, class:classes(id, name, school_year), teacher:users!teacher_id(id, name)`)
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      setActiveSessions(sessions || []);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      setError(error.message || 'Erro ao carregar sessões ativas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h1" sx={{ mb: 1 }}>
                  Bem-vindo, {user?.name || 'Aluno'}! 👋
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Participe de sessões de neurofeedback e acompanhe seu progresso.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      Sessões Ativas
                    </Typography>

                    {activeSessions.length === 0 ? (
                      <Alert severity="info">
                        Nenhuma sessão ativa no momento. Aguarde seu professor iniciar uma sessão.
                      </Alert>
                    ) : (
                      <Grid container spacing={3}>
                        {activeSessions.map((session) => (
                          <Grid item xs={12} md={6} key={session.id}>
                            <MuiCard sx={{ border: '2px solid', borderColor: 'primary.main' }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Chip icon={<WifiIcon />} label="Ao Vivo" color="success" size="small" sx={{ mr: 1 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(session.start_time).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </Typography>
                                </Box>
                                <Typography variant="h3" sx={{ mb: 1 }}>
                                  {session.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                  {session.class?.name} • {session.class?.school_year}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                  Professor: {session.teacher?.name}
                                </Typography>
                                {session.game_id && (
                                  <Chip icon={<SportsEsportsIcon />} label={`Jogo: ${session.game_id}`} size="small" variant="outlined" />
                                )}
                              </CardContent>
                              <CardActions>
                                <Button fullWidth onClick={() => navigate(`/student/session/${session.id}`)} startIcon={<SportsEsportsIcon />}>
                                  Entrar na Sessão
                                </Button>
                              </CardActions>
                            </MuiCard>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      Ações Rápidas
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <MuiCard sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={() => navigate('/student/history')}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <AssessmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h3" sx={{ fontSize: '1.1rem' }}>
                              Histórico
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Ver sessões passadas
                            </Typography>
                          </CardContent>
                        </MuiCard>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <MuiCard sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={() => navigate('/student/settings')}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <SettingsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="h3" sx={{ fontSize: '1.1rem' }}>
                              Configurações
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Dispositivo EEG
                            </Typography>
                          </CardContent>
                        </MuiCard>
                      </Grid>
                    </Grid>
                  </Box>

                  <Alert severity="info">
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Como Funciona
                    </Typography>
                    <Typography variant="body2">
                      1. Aguarde seu professor iniciar uma sessão<br />
                      2. Entre na sessão clicando em "Entrar na Sessão"<br />
                      3. Conecte seu dispositivo EEG quando solicitado<br />
                      4. Jogue e melhore sua atenção!
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>
          </Container>
        }
      />
      <Route path="/session/:sessionId" element={<StudentSession />} />
      <Route path="/history" element={<StudentHistory />} />
      <Route path="/settings" element={<StudentSettings />} />
    </Routes>
  );
}
