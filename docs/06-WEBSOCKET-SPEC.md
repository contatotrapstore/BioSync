# 🔄 WebSocket Specification - NeuroOne

**Versão:** 1.0
**Data:** 2025-11-07
**Biblioteca:** Socket.io v4

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração do Servidor](#configuração-do-servidor)
- [Configuração do Cliente](#configuração-do-cliente)
- [Namespaces e Rooms](#namespaces-e-rooms)
- [Events Specification](#events-specification)
- [Error Handling](#error-handling)
- [Reconnection](#reconnection)

---

## Visão Geral

WebSocket é usado para **comunicação em tempo real** entre:
- **Professor** → Servidor (monitoramento)
- **Aluno** → Servidor (envio dados EEG)
- **Servidor** → Professor (broadcast dados)

**Latência alvo:** < 500ms

---

## Configuração do Servidor

### Setup Socket.io

```javascript
// backend/src/services/websocket.js
const socketIO = require('socket.io');

function initWebSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: [
        'https://admin.neuroone.com',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware de autenticação
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Namespace para sessões
  const sessionsNS = io.of('/sessions');

  sessionsNS.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Importar handlers
    require('./handlers/teacherHandlers')(socket, sessionsNS);
    require('./handlers/studentHandlers')(socket, sessionsNS);

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId}, reason: ${reason}`);
    });
  });

  return io;
}

module.exports = { initWebSocket };
```

### Teacher Handlers

```javascript
// backend/src/services/handlers/teacherHandlers.js
module.exports = (socket, io) => {

  // Professor entra na sala da sessão
  socket.on('teacher:join', async ({ sessionId }) => {
    try {
      // Verificar se é professor da sessão
      const session = await getSessionById(sessionId);
      if (session.teacher_id !== socket.userId) {
        throw new Error('Not authorized');
      }

      // Entrar na sala
      socket.join(`session:${sessionId}`);

      // Notificar sucesso
      socket.emit('teacher:joined', {
        sessionId,
        message: 'Joined session successfully'
      });

      console.log(`Teacher ${socket.userId} joined session ${sessionId}`);

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Professor solicita lista de alunos conectados
  socket.on('teacher:request-students', async ({ sessionId }) => {
    try {
      const participants = await getSessionParticipants(sessionId);

      socket.emit('teacher:students-list', {
        sessionId,
        students: participants
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
```

### Student Handlers

```javascript
// backend/src/services/handlers/studentHandlers.js
const { saveEEGData } = require('../eegService');

module.exports = (socket, io) => {

  // Aluno entra na sessão
  socket.on('student:join', async ({ sessionId }) => {
    try {
      // Verificar se aluno está na sessão
      const isParticipant = await checkSessionParticipant(
        sessionId,
        socket.userId
      );

      if (!isParticipant) {
        throw new Error('Not a participant of this session');
      }

      // Entrar na sala
      socket.join(`session:${sessionId}`);

      // Atualizar status no banco
      await updateParticipantStatus(sessionId, socket.userId, 'online');

      // Notificar professor
      io.to(`session:${sessionId}`).emit('student:connected', {
        studentId: socket.userId,
        timestamp: new Date()
      });

      // Confirmar ao aluno
      socket.emit('student:joined', {
        sessionId,
        message: 'Joined session successfully'
      });

      console.log(`Student ${socket.userId} joined session ${sessionId}`);

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Aluno envia dados EEG
  socket.on('eeg:data', async (data) => {
    try {
      const {
        sessionId,
        timestamp,
        attention,
        relaxation,
        delta,
        theta,
        alpha,
        beta,
        gamma,
        signalQuality
      } = data;

      // Validar dados
      if (!sessionId || attention === undefined) {
        throw new Error('Invalid EEG data');
      }

      // Salvar no banco (async, não bloqueia)
      saveEEGData({
        sessionId,
        studentId: socket.userId,
        timestamp: new Date(timestamp),
        attention,
        relaxation,
        delta,
        theta,
        alpha,
        beta,
        gamma,
        signalQuality
      }).catch(err => console.error('Error saving EEG:', err));

      // Broadcast para professor (tempo real)
      io.to(`session:${sessionId}`).emit('eeg:update', {
        studentId: socket.userId,
        timestamp,
        attention,
        relaxation
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Aluno desconecta
  socket.on('disconnect', async () => {
    try {
      // Buscar sessões ativas do aluno
      const activeSessions = await getActiveSessionsForStudent(socket.userId);

      for (const session of activeSessions) {
        // Atualizar status
        await updateParticipantStatus(
          session.id,
          socket.userId,
          'offline'
        );

        // Notificar professor
        io.to(`session:${session.id}`).emit('student:disconnected', {
          studentId: socket.userId,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
};
```

---

## Servidor Python WebSocket

### Visão Geral

O **Servidor Python** (`server_headless-V4.py`) roda em paralelo ao Backend Node.js e serve como **ponte de dados EEG**.

**Características:**
- Porta: 8080 (Python WebSocket puro)
- Sem autenticação JWT (conexão direta do dispositivo)
- Salva CSV automático
- Redistribui dados para dashboards

### Arquitetura Python

```
[Headset EEG] → [PWA Bluetooth] → [Python WS :8080] → [Node.js Backend]
                                         ↓
                                    [CSVs locais]
```

### Formato de Dados EEG (Python)

#### Dados Enviados (PWA → Python)

```json
{
  "Codigo": "ABC123",
  "Nome": "Joao_Silva",
  "Att": 85,
  "Med": 72,
  "Delta": 123456,
  "Theta": 234567,
  "LowAlpha": 345678,
  "HighAlpha": 456789,
  "LowBeta": 567890,
  "HighBeta": 678901,
  "LowGamma": 789012,
  "MiddleGamma": 890123
}
```

**Campos:**
- `Codigo` - Identificador da sessão
- `Nome` - Nome do aluno (usado para CSV)
- `Att` - Atenção (0-100)
- `Med` - Meditação/Relaxamento (0-100)
- `Delta, Theta, LowAlpha, HighAlpha, LowBeta, HighBeta, LowGamma, MiddleGamma` - Valores absolutos das ondas cerebrais (3 bytes cada = 0-16777215)

#### Dados Redistribuídos (Python → Dashboard)

```json
{
  "ID": 1,
  "Nome": "Joao_Silva",
  "Codigo": "ABC123",
  "Att": 85,
  "Med": 72
}
```

### Conectar ao Servidor Python (PWA)

```javascript
// PWA - Conectar ao servidor Python
const pythonWS = new WebSocket('ws://IP_SERVIDOR:8080');

pythonWS.onopen = () => {
  console.log('Conectado ao servidor Python');
};

pythonWS.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Dados recebidos:', data);
};

// Enviar dados EEG
function sendEEGData(eegData) {
  const payload = {
    Codigo: sessionId,
    Nome: studentName,
    Att: eegData.attention,
    Med: eegData.meditation,
    Delta: eegData.delta,
    Theta: eegData.theta,
    LowAlpha: eegData.lowAlpha,
    HighAlpha: eegData.highAlpha,
    LowBeta: eegData.lowBeta,
    HighBeta: eegData.highBeta,
    LowGamma: eegData.lowGamma,
    MiddleGamma: eegData.middleGamma
  };

  pythonWS.send(JSON.stringify(payload));
}
```

### CSV Gerado Automaticamente

**Nome do arquivo:** `{Nome}.csv`

**Formato:**
```csv
Att,Med,Delta,Theta,LowAlpha,HighAlpha,LowBeta,HighBeta,LowGamma,MiddleGamma
85,72,123456,234567,345678,456789,567890,678901,789012,890123
84,73,123450,234560,345670,456780,567890,678900,789010,890120
...
```

**Localização:**
```
/opt/neuroone/Joao_Silva.csv
/opt/neuroone/Maria_Santos.csv
...
```

### Integração Python ↔ Node.js

**Opção 1: Backend Node.js como Cliente do Python**

```javascript
// backend/src/services/pythonBridge.js
const io = require('socket.io-client');

const pythonSocket = io('ws://IP_PYTHON:8080', {
  transports: ['websocket']
});

pythonSocket.on('connect', () => {
  console.log('Connected to Python server');

  // Identificar como dashboard
  pythonSocket.send('dash');
});

// Receber dados do Python e redistribuir
pythonSocket.on('message', (data) => {
  const eegData = JSON.parse(data);

  // Broadcast para professor via Socket.io Node.js
  sessionsNS.to(`session:${eegData.Codigo}`).emit('eeg:update', {
    studentId: findStudentIdByName(eegData.Nome),
    attention: eegData.Att,
    relaxation: eegData.Med
  });

  // Salvar no Supabase
  saveEEGData({
    studentId: findStudentIdByName(eegData.Nome),
    sessionId: eegData.Codigo,
    attention: eegData.Att,
    meditation: eegData.Med,
    // ... outras métricas
  });
});
```

**Opção 2: PWA envia para ambos em paralelo**

```javascript
// PWA envia dados para Python E para Node.js

// Para Python (backup + CSV)
pythonWS.send(JSON.stringify(eegDataPython));

// Para Node.js (banco de dados + tempo real)
socketIOClient.emit('eeg:data', eegDataNode);
```

---

## Configuração do Cliente

### Frontend (Professor)

```javascript
// frontend/src/services/websocket.js
import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    this.socket = io('https://api.neuroone.com/sessions', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinSessionAsTeacher(sessionId) {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('teacher:join', { sessionId });
  }

  onStudentConnected(callback) {
    this.socket.on('student:connected', callback);
  }

  onStudentDisconnected(callback) {
    this.socket.on('student:disconnected', callback);
  }

  onEEGUpdate(callback) {
    this.socket.on('eeg:update', callback);
  }

  requestStudentsList(sessionId) {
    this.socket.emit('teacher:request-students', { sessionId });
  }

  onStudentsList(callback) {
    this.socket.on('teacher:students-list', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export default new WebSocketService();
```

**Uso no componente React:**

```javascript
// SessionMonitor.jsx
import { useEffect, useState } from 'react';
import websocketService from '../services/websocket';

function SessionMonitor({ sessionId }) {
  const [students, setStudents] = useState([]);
  const [eegData, setEEGData] = useState({});

  useEffect(() => {
    // Conectar
    const token = localStorage.getItem('accessToken');
    websocketService.connect(token);

    // Entrar na sessão
    websocketService.joinSessionAsTeacher(sessionId);

    // Listeners
    websocketService.onStudentConnected((data) => {
      console.log('Student connected:', data);
      // Atualizar UI
    });

    websocketService.onEEGUpdate((data) => {
      setEEGData(prev => ({
        ...prev,
        [data.studentId]: {
          attention: data.attention,
          relaxation: data.relaxation,
          timestamp: data.timestamp
        }
      }));
    });

    // Cleanup
    return () => {
      websocketService.disconnect();
    };
  }, [sessionId]);

  return (
    <div>
      {/* UI aqui */}
    </div>
  );
}
```

---

### Mobile (Aluno)

```typescript
// mobile/src/services/websocket.ts
import io, { Socket } from 'socket.io-client';

class StudentWebSocket {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(token: string): void {
    this.socket = io('https://api.neuroone.com/sessions', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinSession(sessionId: string): void {
    if (!this.socket || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('student:join', { sessionId });
  }

  sendEEGData(data: {
    sessionId: string;
    timestamp: Date;
    attention: number;
    relaxation: number;
    delta: number;
    theta: number;
    alpha: number;
    beta: number;
    gamma: number;
    signalQuality: string;
  }): void {
    if (!this.socket || !this.connected) {
      console.warn('Cannot send EEG data: not connected');
      return;
    }

    this.socket.emit('eeg:data', data);
  }

  onJoined(callback: (data: any) => void): void {
    this.socket?.on('student:joined', callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
  }
}

export default new StudentWebSocket();
```

**Uso:**

```typescript
// SessionActive.tsx
import { useEffect } from 'react';
import websocket from '../services/websocket';
import eegService from '../services/eeg';

function SessionActive({ sessionId }) {
  useEffect(() => {
    // Conectar WebSocket
    const token = localStorage.getItem('accessToken');
    websocket.connect(token);
    websocket.joinSession(sessionId);

    // Loop de transmissão EEG (a cada 250ms = 4 Hz)
    const interval = setInterval(() => {
      const eegData = eegService.getLatestData();

      if (eegData) {
        websocket.sendEEGData({
          sessionId,
          timestamp: new Date(),
          ...eegData
        });
      }
    }, 250);

    return () => {
      clearInterval(interval);
      websocket.disconnect();
    };
  }, [sessionId]);

  return <div>Sessão ativa...</div>;
}
```

---

## Namespaces e Rooms

### Namespace: `/sessions`

Todos os eventos relacionados a sessões de aula.

### Rooms (Salas)

Cada sessão tem sua própria sala:

```
Room: "session:{sessionId}"

Exemplo: "session:123e4567-e89b-12d3-a456-426614174000"
```

**Membros da sala:**
- 1 Professor
- N Alunos participantes

**Broadcasting:**
```javascript
// Enviar para todos na sala (exceto sender)
io.to(`session:${sessionId}`).emit('event', data);

// Enviar para todos na sala (incluindo sender)
io.in(`session:${sessionId}`).emit('event', data);
```

---

## Events Specification

### Teacher Events

#### `teacher:join`
**Direction:** Client → Server
**Payload:**
```javascript
{
  sessionId: "uuid"
}
```
**Response:** `teacher:joined`

---

#### `teacher:joined`
**Direction:** Server → Client
**Payload:**
```javascript
{
  sessionId: "uuid",
  message: "Joined session successfully"
}
```

---

#### `teacher:request-students`
**Direction:** Client → Server
**Payload:**
```javascript
{
  sessionId: "uuid"
}
```
**Response:** `teacher:students-list`

---

#### `teacher:students-list`
**Direction:** Server → Client
**Payload:**
```javascript
{
  sessionId: "uuid",
  students: [
    {
      studentId: "uuid",
      name: "João Silva",
      connectionStatus: "online",
      signalQuality: "good"
    }
  ]
}
```

---

### Student Events

#### `student:join`
**Direction:** Client → Server
**Payload:**
```javascript
{
  sessionId: "uuid"
}
```
**Response:** `student:joined`
**Broadcast:** `student:connected` (para professor)

---

#### `student:joined`
**Direction:** Server → Client
**Payload:**
```javascript
{
  sessionId: "uuid",
  message: "Joined session successfully"
}
```

---

#### `student:connected`
**Direction:** Server → Professor
**Payload:**
```javascript
{
  studentId: "uuid",
  timestamp: "2025-11-07T12:30:00.000Z"
}
```

---

#### `student:disconnected`
**Direction:** Server → Professor
**Payload:**
```javascript
{
  studentId: "uuid",
  timestamp: "2025-11-07T12:45:00.000Z"
}
```

---

### EEG Events

#### `eeg:data`
**Direction:** Aluno → Server
**Frequency:** ~4 Hz (a cada 250ms)
**Payload:**
```javascript
{
  sessionId: "uuid",
  timestamp: "2025-11-07T12:30:00.123Z",
  attention: 75,        // 0-100
  relaxation: 68,       // 0-100
  delta: 0.15,          // power spectrum
  theta: 0.22,
  alpha: 0.65,
  beta: 0.45,
  gamma: 0.08,
  signalQuality: "good" // excellent, good, fair, poor
}
```
**Broadcast:** `eeg:update` (para professor)

---

#### `eeg:update`
**Direction:** Server → Professor
**Payload:**
```javascript
{
  studentId: "uuid",
  timestamp: "2025-11-07T12:30:00.123Z",
  attention: 75,
  relaxation: 68
}
```

---

### Error Events

#### `error`
**Direction:** Server → Client
**Payload:**
```javascript
{
  message: "Error description",
  code: "ERROR_CODE" // opcional
}
```

---

## Error Handling

### Client-side

```javascript
websocket.socket.on('error', (error) => {
  console.error('Socket error:', error);

  // Mostrar toast/alert para usuário
  showErrorToast(error.message);

  // Log para monitoring
  logError('websocket_error', error);
});

websocket.socket.on('connect_error', (error) => {
  console.error('Connection error:', error);

  // Tentar reconectar manualmente se necessário
  if (error.message.includes('Authentication')) {
    // Renovar token e reconectar
    refreshTokenAndReconnect();
  }
});
```

### Server-side

```javascript
try {
  // Lógica do evento
} catch (error) {
  console.error('Handler error:', error);

  socket.emit('error', {
    message: error.message,
    code: 'HANDLER_ERROR'
  });
}
```

---

## Reconnection

### Estratégia de Reconexão

**Client-side (automática):**
```javascript
{
  reconnection: true,
  reconnectionDelay: 1000,      // 1s
  reconnectionDelayMax: 5000,   // 5s max
  reconnectionAttempts: 5       // 5 tentativas
}
```

**Após reconexão:**
1. Cliente deve re-entrar na sessão (`teacher:join` ou `student:join`)
2. Servidor reenvia estado atual se necessário
3. Professor recarrega lista de alunos conectados

---

## Performance

### Throttling de Eventos

**EEG Data:**
- Frequência máxima: 4 Hz (250ms)
- Se dispositivo envia a 256Hz, fazer downsampling no cliente

**UI Updates:**
- Usar `requestAnimationFrame` no frontend
- Batch updates se múltiplos alunos enviarem dados simultaneamente

---

## Documentos Relacionados

- [03-ARQUITETURA.md](./03-ARQUITETURA.md) - Arquitetura geral
- [09-FASE-3-PROFESSOR.md](./09-FASE-3-PROFESSOR.md) - Implementação

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
