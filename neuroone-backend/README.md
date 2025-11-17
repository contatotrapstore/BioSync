# NeuroOne Backend - WebSocket Server

Backend Node.js com Socket.io para streaming em tempo real de dados EEG do sistema NeuroOne.

## 📋 Descrição

Este servidor WebSocket gerencia a comunicação em tempo real entre:
- **Professores**: Recebem dados EEG de todos alunos em uma sessão
- **Alunos**: Enviam dados EEG a cada 250ms (4Hz)

## 🚀 Tecnologias

- **Node.js** 18+
- **Express** 4.18 - HTTP server
- **Socket.io** 4.7 - WebSocket real-time communication
- **PostgreSQL** (via `pg`) - Database persistence
- **dotenv** - Environment configuration

## 📦 Instalação

```bash
cd neuroone-backend
npm install
```

## ⚙️ Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Configure as variáveis no `.env`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

## 🏃‍♂️ Execução

### Modo de desenvolvimento (com auto-reload):
```bash
npm run dev
```

### Modo de produção:
```bash
npm start
```

O servidor iniciará em `http://localhost:3001`

## 📡 Endpoints

### HTTP REST

- **GET /** - Informações da API
- **GET /health** - Health check

### WebSocket Events

#### **Professor (Teacher)**

**Emitir**:
- `teacher:join` - Entrar em uma sessão
  ```javascript
  socket.emit('teacher:join', { sessionId: 'uuid' });
  ```
- `teacher:leave` - Sair de uma sessão
  ```javascript
  socket.emit('teacher:leave', { sessionId: 'uuid' });
  ```
- `teacher:get-students` - Solicitar lista de alunos
  ```javascript
  socket.emit('teacher:get-students', { sessionId: 'uuid' });
  ```

**Receber**:
- `teacher:joined` - Confirmação de entrada
- `teacher:students` - Lista de alunos
- `eeg:update` - Dados EEG de um aluno (broadcast)
  ```javascript
  socket.on('eeg:update', (data) => {
    console.log(data.studentId, data.attention, data.relaxation);
  });
  ```
- `student:connected` - Aluno conectou
- `student:disconnected` - Aluno desconectou

---

#### **Aluno (Student)**

**Emitir**:
- `student:join` - Entrar em uma sessão
  ```javascript
  socket.emit('student:join', {
    sessionId: 'uuid',
    studentId: 'uuid',
    studentName: 'Nome do Aluno'
  });
  ```
- `student:leave` - Sair de uma sessão
- `eeg:data` - Enviar dados EEG
  ```javascript
  socket.emit('eeg:data', {
    attention: 75,
    relaxation: 65,
    delta: 120000,
    theta: 230000,
    alpha: 340000,
    beta: 150000,
    gamma: 90000,
    signalQuality: 80,
    timestamp: new Date().toISOString()
  });
  ```

**Receber**:
- `student:joined` - Confirmação de entrada
- `eeg:received` - Confirmação de recebimento de dados
- `teacher:connected` - Professor conectou
- `teacher:disconnected` - Professor desconectou

---

## 🗄️ Estrutura de Dados

### EEG Data Packet

```javascript
{
  sessionId: 'uuid',
  studentId: 'uuid',
  timestamp: '2025-11-17T10:30:00.000Z',
  attention: 75,        // 0-100
  relaxation: 65,       // 0-100
  delta: 120000,        // Low frequency (0.5-3Hz)
  theta: 230000,        // (4-7Hz)
  alpha: 340000,        // (8-13Hz)
  beta: 150000,         // (14-30Hz)
  gamma: 90000,         // (31-50Hz)
  signalQuality: 80,    // 0-100
  rawData: null         // Optional raw EEG buffer
}
```

## 📂 Estrutura do Projeto

```
neuroone-backend/
├── src/
│   ├── handlers/
│   │   ├── teacherHandlers.js    # Teacher event handlers
│   │   └── studentHandlers.js    # Student event handlers
│   ├── services/
│   │   └── database.js           # PostgreSQL queries
│   ├── utils/
│   │   └── logger.js             # Logging utility
│   └── server.js                 # Main entry point
├── .env.example                  # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Funções Principais

### `database.js`
- `saveEEGData(data)` - Salva dados EEG no banco
- `getSession(sessionId)` - Busca informações da sessão
- `getSessionStudents(sessionId)` - Lista alunos da sessão
- `updateSessionStatus(sessionId, status)` - Atualiza status da sessão

### `teacherHandlers.js`
- `handleTeacherJoin(io, socket, data)` - Professor entra na sala
- `handleTeacherLeave(io, socket, data)` - Professor sai da sala
- `handleGetStudents(socket, data)` - Retorna lista de alunos

### `studentHandlers.js`
- `handleStudentJoin(io, socket, data)` - Aluno entra na sala
- `handleStudentLeave(io, socket, data)` - Aluno sai da sala
- `handleEEGData(io, socket, data)` - Processa e broadcast dados EEG

## 🔐 Segurança

- CORS configurado para origens permitidas
- Validação de dados em todos os handlers
- Verificação de permissões (sessão ativa, aluno matriculado)
- SSL/TLS para conexões PostgreSQL

## 📊 Persistência

Todos os dados EEG são salvos na tabela `eeg_data`:

```sql
CREATE TABLE eeg_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  student_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ NOT NULL,
  attention INTEGER,
  relaxation INTEGER,
  delta BIGINT,
  theta BIGINT,
  alpha BIGINT,
  beta BIGINT,
  gamma BIGINT,
  signal_quality INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🧪 Testando Conexão

### Cliente JavaScript (Frontend)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
});

// Professor
socket.emit('teacher:join', { sessionId: 'your-session-id' });

socket.on('eeg:update', (data) => {
  console.log('EEG Update:', data);
});

// Aluno
socket.emit('student:join', {
  sessionId: 'your-session-id',
  studentId: 'your-student-id',
  studentName: 'Test Student'
});

setInterval(() => {
  socket.emit('eeg:data', {
    attention: Math.floor(Math.random() * 100),
    relaxation: Math.floor(Math.random() * 100),
    delta: 120000,
    theta: 230000,
    alpha: 340000,
    beta: 150000,
    gamma: 90000,
    signalQuality: 80,
  });
}, 250);
```

## 🐛 Debug

Ative logs detalhados:

```bash
NODE_ENV=development npm run dev
```

## 📝 Logs

O servidor registra:
- ✅ Conexões e desconexões
- 📥 Entrada/saída de salas
- 📊 Recebimento de dados EEG
- ❌ Erros e exceções

## 🤝 Integração Frontend

O frontend React já está configurado com:
- `useWebSocketEEG` hook em [neuroone-frontend/src/hooks/useWebSocketEEG.js](../neuroone-frontend/src/hooks/useWebSocketEEG.js)
- Configuração em `VITE_WS_URL=http://localhost:3001`

## 📌 Próximos Passos

- [ ] Implementar autenticação JWT
- [ ] Adicionar rate limiting
- [ ] Implementar compressão de dados
- [ ] Adicionar métricas e monitoring
- [ ] Testes unitários e integração
- [ ] Deploy em produção (Railway/Render)

## 📄 Licença

MIT

---

**Desenvolvido para NeuroOne** - Sistema de Neurofeedback Educacional
