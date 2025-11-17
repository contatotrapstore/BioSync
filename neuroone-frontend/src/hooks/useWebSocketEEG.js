import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { supabase } from '../services/supabase';

// WebSocket server configuration
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

/**
 * Get Supabase access token
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    console.warn('No active session');
    return null;
  }
  return data.session.access_token;
}

/**
 * Hook para gerenciar conexão WebSocket e receber dados EEG em tempo real
 * @param {string} sessionId - ID da sessão ativa
 * @returns {Object} { studentsData, isConnected, error, reconnect }
 */
export function useWebSocketEEG(sessionId) {
  const [studentsData, setStudentsData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!sessionId) return;

    // Inicializar conexão Socket.io com token JWT
    async function connectSocket() {
      const token = await getAuthToken();

      if (!token) {
        setError('Não autenticado. Faça login novamente.');
        return;
      }

      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        auth: {
          token,
        },
      });

      socketRef.current = socket;

      // Event: Conexão estabelecida
      socket.on('connect', () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Entrar na sala da sessão
        socket.emit('teacher:join', { sessionId });
      });

      // Event: Desconexão
      socket.on('disconnect', (reason) => {
        console.warn('⚠️ WebSocket desconectado:', reason);
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          // Servidor desconectou - tentar reconectar manualmente
          socket.connect();
        }
      });

      // Event: Erro de conexão
      socket.on('connect_error', (err) => {
        console.error('❌ Erro de conexão WebSocket:', err.message);
        reconnectAttemptsRef.current += 1;

        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else {
          setError(`Tentando reconectar... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
        }
      });

      // Event: Dados EEG recebidos de um aluno
      socket.on('eeg:update', (data) => {
        // data = { studentId, timestamp, attention, relaxation, delta, theta, alpha, beta, gamma }
        setStudentsData((prev) => ({
          ...prev,
          [data.studentId]: {
            attention: data.attention,
            relaxation: data.relaxation,
            delta: data.delta || 0,
            theta: data.theta || 0,
            alpha: data.alpha || 0,
            beta: data.beta || 0,
            gamma: data.gamma || 0,
            timestamp: data.timestamp,
            signalQuality: data.signalQuality || 0,
          },
        }));
      });

      // Event: Aluno conectou
      socket.on('student:connected', (data) => {
        console.log('👤 Aluno conectou:', data.studentId);
        // Pode ser usado para mostrar notificação
      });

      // Event: Aluno desconectou
      socket.on('student:disconnected', (data) => {
        console.log('👤 Aluno desconectou:', data.studentId);

        // Marcar aluno como offline nos dados
        setStudentsData((prev) => {
          const updated = { ...prev };
          if (updated[data.studentId]) {
            updated[data.studentId] = {
              ...updated[data.studentId],
              offline: true,
            };
          }
          return updated;
        });
      });

      // Event: Erro do servidor
      socket.on('error', (data) => {
        console.error('❌ Erro do servidor:', data.message);
        setError(data.message);
      });
    }

    connectSocket();

    // Cleanup ao desmontar componente
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('teacher:leave', { sessionId });
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  // Função para reconectar manualmente
  const reconnect = () => {
    if (socketRef.current) {
      reconnectAttemptsRef.current = 0;
      setError(null);
      socketRef.current.connect();
    }
  };

  return {
    studentsData,
    isConnected,
    error,
    reconnect,
  };
}
