import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { supabase } from '../../services/supabase';
import io from 'socket.io-client';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import BluetoothDisabledIcon from '@mui/icons-material/BluetoothDisabled';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function StudentSession() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState(null);
  const socketRef = useRef(null);

  // EEG state
  const [eegConnected, setEegConnected] = useState(false);
  const [eegData, setEegData] = useState({
    attention: 0,
    relaxation: 0,
    signalQuality: 0,
  });

  // Load session data
  useEffect(() => {
    if (user && sessionId) {
      fetchSession();
    }
  }, [user, sessionId]);

  async function fetchSession() {
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

      // Build complete session object BEFORE calling setSession
      // This prevents multiple re-renders that cause WebSocket reconnections
      const sessionData = sessionResult.data;

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

      // Buscar dados do professor (com timeout)
      try {
        const teacherResponse = await Promise.race([
          fetch(`${API_URL}/api/users/${sessionData.teacher_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);

        if (teacherResponse.ok) {
          const teacherResult = await teacherResponse.json();
          if (teacherResult.success) {
            sessionData.teacher = teacherResult.data;
          }
        }
      } catch (error) {
        console.warn('Não foi possível carregar dados do professor:', error.message);
        // Continua mesmo sem dados do professor
      }

      // Verify student is in this class
      const studentsResponse = await fetch(`${API_URL}/api/classes/${sessionData.class_id}/students`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!studentsResponse.ok) {
        throw new Error(`HTTP ${studentsResponse.status}: ${studentsResponse.statusText}`);
      }

      const studentsResult = await studentsResponse.json();

      if (!studentsResult.success) {
        throw new Error(studentsResult.error || 'Erro ao verificar matrícula');
      }

      const isEnrolled = (studentsResult.data || []).some(student => student.id === user.id);

      if (!isEnrolled) {
        setError('Você não está matriculado nesta turma.');
        return;
      }

      // Check session status
      if (sessionData.status !== 'active') {
        setError('Esta sessão não está mais ativa.');
        return;
      }

      // Call setSession ONCE with complete data to prevent WebSocket reconnections
      setSession(sessionData);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      setError(error.message || 'Erro ao carregar sessão.');
    } finally {
      setLoading(false);
    }
  }

  // Connect to WebSocket
  useEffect(() => {
    if (!session) return;

    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

    // Get JWT token and connect
    async function connectSocket() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.warn('No active session for WebSocket auth');
        setWsError('Não autenticado. Faça login novamente.');
        return;
      }

      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        auth: {
          token: data.session.access_token,
        },
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        setWsError(null);

        // Join session as student
        socket.emit('student:join', {
          sessionId: session.id,
          studentId: user.id,
          studentName: user.name,
        });
      });

      socket.on('student:joined', (data) => {
        console.log('Joined session:', data);
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setWsConnected(false);
      });

      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
        setWsError(err.message || 'Erro de conexão');
      });

      // Listen for EEG data updates from backend (sent by Python bridge or other students)
      socket.on('eeg:update', (data) => {
        // Only process data for this student
        if (data.studentId === user.id) {
          console.log('Received EEG data:', data);
          setEegData({
            attention: data.attention,
            relaxation: data.relaxation,
            signalQuality: data.signalQuality,
          });
        }
      });

      // Listen for EEG data acknowledgment
      socket.on('eeg:received', (data) => {
        console.log('EEG data received by backend:', data);
      });

      socketRef.current = socket;
    }

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('student:leave', {
          sessionId: session.id,
        });
        socketRef.current.disconnect();
      }
    };
  }, [session, user]);

  // Detect real EEG connection based on signal quality (not just WebSocket)
  useEffect(() => {
    if (eegData.signalQuality > 0) {
      if (!eegConnected) {
        setEegConnected(true);
        console.log('✅ EEG device conectado! Signal quality:', eegData.signalQuality);
      }
    } else {
      if (eegConnected) {
        setEegConnected(false);
        console.log('❌ EEG device desconectado');
      }
    }
  }, [eegData.signalQuality, eegConnected]);

  // Helper function to open windows with smart sizing
  const openGameWindow = (url, type = 'game') => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    let width, height, left, top;

    if (type === 'game') {
      // Jogo em tela cheia ou quase tela cheia
      width = Math.min(1920, screenWidth);
      height = Math.min(1080, screenHeight);
      left = (screenWidth - width) / 2;
      top = (screenHeight - height) / 2;
    } else if (type === 'monitor') {
      // Monitor em tamanho tablet landscape
      width = 1024;
      height = 768;
      left = (screenWidth - width) / 2;
      top = (screenHeight - height) / 2;
    }

    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;
    const newWindow = window.open(url, '_blank', features);

    // Tentar colocar em fullscreen se for jogo (pode não funcionar em todos os browsers)
    if (type === 'game' && newWindow) {
      try {
        newWindow.moveTo(0, 0);
        newWindow.resizeTo(screenWidth, screenHeight);
      } catch (e) {
        console.log('Fullscreen não disponível neste navegador');
      }
    }

    return newWindow;
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={() => navigate('/student')}>Voltar</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h1" sx={{ mb: 0.5 }}>
            {session?.title || 'Sessão'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {session?.class?.name} • Professor: {session?.teacher?.name}
          </Typography>
        </Box>

        {/* Status Chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {wsConnected ? (
            <Chip icon={<WifiIcon />} label="Conectado ao Servidor" color="success" size="small" />
          ) : (
            <Chip icon={<WifiOffIcon />} label="Desconectado" color="error" size="small" />
          )}

          {eegConnected ? (
            <Chip icon={<BluetoothIcon />} label="EEG Conectado" color="primary" size="small" />
          ) : (
            <Chip icon={<BluetoothDisabledIcon />} label="EEG Desconectado" color="default" size="small" />
          )}
        </Stack>

        {/* WebSocket Error */}
        {wsError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {wsError}
          </Alert>
        )}

        {/* EEG Data Display - Only show when connected */}
        {eegConnected && (
          <Card sx={{ mb: 3, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h2">
                Dados em Tempo Real
              </Typography>
            </Box>

              {/* Attention */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Atenção
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {eegData.attention}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={eegData.attention}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor:
                        eegData.attention >= 70 ? 'success.main' : eegData.attention >= 40 ? 'warning.main' : 'error.main',
                    },
                  }}
                />
              </Box>

              {/* Relaxation */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Relaxamento
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {eegData.relaxation}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={eegData.relaxation}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'info.main',
                    },
                  }}
                />
              </Box>

              {/* Signal Quality */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Qualidade do Sinal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {eegData.signalQuality}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={eegData.signalQuality}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: eegData.signalQuality >= 70 ? 'success.main' : 'warning.main',
                    },
                  }}
                />
              </Box>
          </Card>
        )}

        {/* Game/Monitor Options - Always visible */}
        {session.session_type === 'neurogame' ? (
          <Box sx={{ mb: 3 }}>
                <Typography variant="h2" sx={{ mb: 2 }}>
                  🚀 Jogos de Neurofeedback
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Jogos que abrem em nova janela com conexão Bluetooth própria
                </Typography>

                {/* Fazendinha 3D */}
                <Card sx={{ mb: 2, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <SportsEsportsIcon sx={{ fontSize: 48, color: 'primary.main', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        🎮 Fazendinha 3D
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Jogo completo com renderização 3D. Controle o trator com sua atenção!
                      </Typography>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          ⚠️ Atenção: Conexão Bluetooth Separada
                        </Typography>
                        <Typography variant="caption">
                          Este jogo abre em tela cheia para melhor experiência imersiva.
                          Gerencia sua própria conexão Bluetooth. O monitor integrado desta página será pausado enquanto você joga.
                        </Typography>
                      </Alert>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={async () => {
                          // Get auth token from Supabase
                          const { data } = await supabase.auth.getSession();
                          const token = data?.session?.access_token;

                          if (token) {
                            // Store in localStorage as fallback for same-origin pages
                            localStorage.setItem('authToken', token);

                            // Pass token in URL for cross-origin game window (localhost:3001)
                            const gameUrl = `${API_URL}/games/fazendinha/index.html?sessionId=${session.id}&studentId=${user.id}&studentName=${encodeURIComponent(user.name)}&token=${encodeURIComponent(token)}`;
                            console.log('✅ Token incluído na URL do jogo');
                            openGameWindow(gameUrl, 'game');
                          } else {
                            console.error('❌ Não foi possível obter token de autenticação');
                            alert('Erro: Não foi possível autenticar. Por favor, faça login novamente.');
                          }
                        }}
                      >
                        Abrir Fazendinha 3D em Tela Cheia
                      </Button>
                    </Box>
                  </Box>
                </Card>
          </Box>
        ) : session.session_type === 'monitoramento' ? (
          <Box sx={{ mb: 3 }}>
                <Typography variant="h2" sx={{ mb: 2 }}>
                  📊 Monitor de Ondas Cerebrais
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Acompanhe suas ondas cerebrais em tempo real durante a aula
                </Typography>

                {/* Monitor EEG Standalone */}
                <Card sx={{ mb: 3, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <BluetoothIcon sx={{ fontSize: 48, color: 'info.main', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        📊 Monitor EEG Standalone
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Interface visual avançada para monitorar todas as ondas cerebrais em tempo real.
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          ℹ️ Visualização Avançada em Tamanho Tablet
                        </Typography>
                        <Typography variant="caption">
                          Este monitor abre em janela otimizada (1024x768) perfeita para tablets.
                          Mostra as 8 bandas de ondas cerebrais (Delta, Theta, Alpha, Beta, Gamma)
                          com gráficos detalhados e conexão Bluetooth própria.
                        </Typography>
                      </Alert>
                      <Button
                        variant="contained"
                        color="info"
                        size="large"
                        fullWidth
                        onClick={async () => {
                          // Get auth token from Supabase
                          const { data } = await supabase.auth.getSession();
                          const token = data?.session?.access_token;

                          if (token) {
                            // Store in localStorage as fallback for same-origin pages
                            localStorage.setItem('authToken', token);

                            // Pass token in URL for cross-origin monitor window (localhost:3001)
                            const monitorUrl = `${API_URL}/monitor/eeg-monitor.html?sessionId=${session.id}&studentId=${user.id}&token=${encodeURIComponent(token)}`;
                            console.log('✅ Token incluído na URL do monitor');
                            openGameWindow(monitorUrl, 'monitor');
                          } else {
                            console.error('❌ Não foi possível obter token de autenticação');
                            alert('Erro: Não foi possível autenticar. Por favor, faça login novamente.');
                          }
                        }}
                      >
                        Abrir Monitor em Tamanho Tablet
                      </Button>
                    </Box>
                  </Box>
                </Card>
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tipo de sessão não reconhecido. Entre em contato com o professor.
          </Alert>
        )}

        <Button variant="outlined" onClick={() => navigate('/student')} fullWidth>
          Sair da Sessão
        </Button>
      </Box>
    </Container>
  );
}
