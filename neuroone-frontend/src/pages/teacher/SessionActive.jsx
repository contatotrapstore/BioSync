import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Button as MuiButton,
  Grid,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { StudentGrid } from '../../components/teacher/StudentGrid';
import { useWebSocketEEG } from '../../hooks/useWebSocketEEG';
import { supabase } from '../../services/supabase';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export function SessionActive() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [ending, setEnding] = useState(false);

  // WebSocket hook para receber dados EEG
  const { studentsData, isConnected, error: wsError, reconnect } = useWebSocketEEG(sessionId);

  // Thresholds (pode vir de config ou usar padrão)
  const thresholds = {
    low: session?.attention_threshold_low || 40,
    high: session?.attention_threshold_high || 70,
  };

  // Carregar dados da sessão
  useEffect(() => {
    if (user && sessionId) {
      fetchSessionData();
    }
  }, [user, sessionId]);

  async function fetchSessionData() {
    setLoading(true);
    try {
      // Buscar sessão com turma e alunos
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(
          `
          *,
          class:classes(
            id,
            name,
            school_year
          )
        `
        )
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Verificar se sessão pertence ao professor
      if (sessionData.teacher_id !== user.id) {
        setError('Você não tem permissão para acessar esta sessão.');
        return;
      }

      // Verificar se sessão está ativa
      if (sessionData.status === 'completed') {
        // Redirecionar diretamente para relatório
        navigate(`/teacher/session/${sessionId}/report`);
        return;
      }

      setSession(sessionData);

      // Buscar alunos da turma
      const { data: classStudents, error: studentsError } = await supabase
        .from('class_students')
        .select(
          `
          student_id,
          student:users!student_id(
            id,
            name,
            email
          )
        `
        )
        .eq('class_id', sessionData.class_id);

      if (studentsError) throw studentsError;

      // Inicializar array de alunos
      const studentsArray = (classStudents || []).map((cs) => ({
        id: cs.student.id,
        name: cs.student.name,
        email: cs.student.email,
        connected: false,
        eegData: null,
      }));

      setStudents(studentsArray);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      setError(error.message || 'Erro ao carregar dados da sessão.');
    } finally {
      setLoading(false);
    }
  }

  // Atualizar dados dos alunos quando receber via WebSocket
  useEffect(() => {
    if (Object.keys(studentsData).length > 0) {
      setStudents((prevStudents) =>
        prevStudents.map((student) => ({
          ...student,
          eegData: studentsData[student.id] || student.eegData,
          connected: !!studentsData[student.id] && !studentsData[student.id].offline,
        }))
      );
    }
  }, [studentsData]);

  // Timer de duração da sessão
  useEffect(() => {
    if (!session || !session.start_time) return;

    const interval = setInterval(() => {
      const start = new Date(session.start_time);
      const now = new Date();
      const diffSeconds = Math.floor((now - start) / 1000);
      setDuration(diffSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Formatar duração em HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calcular estatísticas
  const connectedCount = students.filter((s) => s.connected).length;
  const totalCount = students.length;

  const averageAttention =
    connectedCount > 0
      ? students
          .filter((s) => s.connected && s.eegData?.attention !== null && s.eegData?.attention !== undefined)
          .reduce((sum, s) => sum + s.eegData.attention, 0) /
        students.filter((s) => s.connected && s.eegData?.attention !== null && s.eegData?.attention !== undefined)
          .length
      : 0;

  // Finalizar sessão
  const handleEndSession = useCallback(async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja finalizar esta sessão?\n\nEsta ação não pode ser desfeita. Os dados serão processados e você será redirecionado para o relatório.'
    );

    if (!confirmed) return;

    setEnding(true);
    try {
      // Atualizar sessão no banco
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Redirecionar para relatório
      setTimeout(() => {
        navigate(`/teacher/session/${sessionId}/report`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      setError(error.message || 'Erro ao finalizar sessão.');
      setEnding(false);
    }
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={() => navigate('/teacher')}>Voltar ao Dashboard</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h1" sx={{ mb: 0.5 }}>
              {session?.title || 'Sessão Ativa'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {session?.class?.name || 'Turma'} • {session?.class?.school_year || ''}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Status de Conexão WebSocket */}
            {isConnected ? (
              <Chip icon={<WifiIcon />} label="Conectado" color="success" size="small" />
            ) : (
              <Chip
                icon={<WifiOffIcon />}
                label="Desconectado"
                color="error"
                size="small"
                onClick={reconnect}
                sx={{ cursor: 'pointer' }}
              />
            )}

            <Button variant="outlined" color="error" onClick={handleEndSession} disabled={ending}>
              {ending ? 'Finalizando...' : '⏹️ Finalizar Sessão'}
            </Button>
          </Stack>
        </Box>

        {/* Alertas */}
        {wsError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => {}}>
            {wsError}
          </Alert>
        )}

        {/* Stats Bar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <PeopleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {connectedCount}/{totalCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Alunos Conectados
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {averageAttention.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Atenção Média
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                {formatDuration(duration)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Duração
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Grid de Alunos */}
        <Box>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Monitoramento em Tempo Real
          </Typography>

          {students.length === 0 ? (
            <Card>
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ mb: 1, color: 'text.secondary' }}>
                  Nenhum aluno cadastrado
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Adicione alunos à turma para começar o monitoramento
                </Typography>
              </Box>
            </Card>
          ) : (
            <StudentGrid students={students} thresholds={thresholds} />
          )}
        </Box>
      </Box>
    </Container>
  );
}
