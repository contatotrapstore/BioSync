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
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
import { ConcentrationGame } from '../../components/games/ConcentrationGame';
import { BalanceGame } from '../../components/games/BalanceGame';

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

  // Game state
  const [selectedGame, setSelectedGame] = useState('');
  const [gameResults, setGameResults] = useState(null);

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

      // Buscar dados do professor
      const teacherResponse = await fetch(`${API_URL}/api/users/${sessionData.teacher_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (teacherResponse.ok) {
        const teacherResult = await teacherResponse.json();
        if (teacherResult.success) {
          sessionData.teacher = teacherResult.data;
        }
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

  // Connect to EEG device (real device via Python bridge)
  const connectEEG = useCallback(() => {
    setEegConnected(true);

    // EEG data will be received via 'eeg:update' Socket.IO event
    // The Python bridge (eeg_bridge.py) sends data to the backend,
    // which broadcasts it to all connected clients in the session room

    console.log('🔌 EEG connection marked as ready. Waiting for data from Python bridge...');
    console.log('📝 To start the Python EEG bridge, run:');
    console.log(`   python neuroone-python-eeg/eeg_bridge.py --student-id ${user.id} --session-id ${session.id}`);
  }, [user, session]);

  const disconnectEEG = useCallback(() => {
    setEegConnected(false);
    setEegData({
      attention: 0,
      relaxation: 0,
      signalQuality: 0,
    });
    console.log('🔌 EEG connection marked as disconnected');
  }, []);

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

        {/* EEG Connection Card */}
        {!eegConnected ? (
          <Card sx={{ mb: 3, p: 3, textAlign: 'center' }}>
            <BluetoothIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h2" sx={{ mb: 1 }}>
              Conecte seu Dispositivo EEG
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Para participar da sessão, conecte seu dispositivo EEG e siga as instruções na tela.
            </Typography>
            <Button
              size="large"
              onClick={connectEEG}
              disabled={!wsConnected}
              startIcon={<BluetoothIcon />}
            >
              {wsConnected ? 'Conectar Dispositivo EEG' : 'Aguardando Conexão ao Servidor...'}
            </Button>
          </Card>
        ) : (
          <>
            {/* EEG Data Display */}
            <Card sx={{ mb: 3, p: 3 }}>
              <Typography variant="h2" sx={{ mb: 2 }}>
                Dados em Tempo Real
              </Typography>

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

            {/* Game Area */}
            <Card sx={{ mb: 3, p: 3 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Selecionar Jogo</InputLabel>
                <Select
                  value={selectedGame}
                  label="Selecionar Jogo"
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  <MenuItem value="concentration">Jogo de Concentração</MenuItem>
                  <MenuItem value="balance">Jogo de Balanço</MenuItem>
                  <MenuItem value="fazendinha">🎮 Fazendinha 3D (Neurofeedback)</MenuItem>
                  <MenuItem value="monitor">📊 Monitor EEG Standalone</MenuItem>
                </Select>
              </FormControl>

              {selectedGame === 'fazendinha' && (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'primary.50',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <SportsEsportsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    🎮 Fazendinha 3D
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Jogo completo com renderização 3D. Controle o trator com sua atenção!
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'text.secondary' }}>
                    O jogo será aberto em uma nova aba. Conecte seu headset EEG via Bluetooth dentro do jogo.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      const gameUrl = `${API_URL}/games/fazendinha/index.html?sessionId=${session.id}&studentId=${user.id}&studentName=${encodeURIComponent(user.name)}`;
                      window.open(gameUrl, '_blank', 'width=1280,height=720');
                    }}
                  >
                    Abrir Fazendinha 3D
                  </Button>
                </Paper>
              )}

              {selectedGame === 'monitor' && (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'info.50',
                    border: '2px solid',
                    borderColor: 'info.main',
                  }}
                >
                  <BluetoothIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    📊 Monitor EEG Standalone
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Interface visual para monitorar suas ondas cerebrais em tempo real.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'text.secondary' }}>
                    Visualize atenção, meditação e todas as bandas de ondas cerebrais (Delta, Theta, Alpha, Beta, Gamma).
                  </Typography>
                  <Button
                    variant="contained"
                    color="info"
                    size="large"
                    onClick={() => {
                      const monitorUrl = `${API_URL}/monitor/eeg-monitor.html?sessionId=${session.id}&studentId=${user.id}`;
                      window.open(monitorUrl, '_blank', 'width=1024,height=768');
                    }}
                  >
                    Abrir Monitor EEG
                  </Button>
                </Paper>
              )}

              {selectedGame === 'concentration' && (
                <ConcentrationGame
                  eegData={eegData}
                  onGameEnd={(results) => {
                    setGameResults(results);
                    console.log('Game results:', results);
                  }}
                />
              )}

              {selectedGame === 'balance' && (
                <BalanceGame
                  eegData={eegData}
                  onGameEnd={(results) => {
                    setGameResults(results);
                    console.log('Game results:', results);
                  }}
                />
              )}

              {!selectedGame && (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300',
                  }}
                >
                  <SportsEsportsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    Selecione um Jogo
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Escolha um jogo de neurofeedback acima para começar a treinar!
                  </Typography>
                </Paper>
              )}
            </Card>

            {/* Disconnect Button */}
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" color="error" onClick={disconnectEEG} fullWidth>
                Desconectar EEG
              </Button>
              <Button variant="outlined" onClick={() => navigate('/student')} fullWidth>
                Sair da Sessão
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Container>
  );
}
