# 🏛️ Arquitetura - NeuroOne

**Versão:** 1.0
**Data:** 2025-11-07

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Diagrama de Arquitetura](#diagrama-de-arquitetura)
- [Camadas do Sistema](#camadas-do-sistema)
- [Fluxo de Dados](#fluxo-de-dados)
- [Comunicação em Tempo Real](#comunicação-em-tempo-real)
- [Segurança](#segurança)
- [Escalabilidade](#escalabilidade)

---

## Visão Geral

NeuroOne usa arquitetura **Cliente-Servidor** com comunicação **REST + WebSocket**.

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE                            │
├─────────────────────────────────────────────────────────┤
│  Web Admin (React)  │  PWA Mobile (React)               │
│  - Direção          │  - Aluno                          │
│  - Professor        │  - Web Bluetooth API              │
│                     │  - ThinkGear Parser (JS)          │
└──────────┬──────────┴──────────┬───────────────────────┘
           │                     │
           │ REST API            │ WebSocket (Node.js)
           │ (HTTP/HTTPS)        │ (WSS)
           │                     │
┌──────────▼─────────────────────▼───────────────────────┐
│                   BACKEND (Node.js)                     │
├─────────────────────────────────────────────────────────┤
│  Express.js REST API  │  Socket.io WebSocket Server    │
│  - Auth (JWT)         │  - Namespaces: /sessions       │
│  - CRUD Endpoints     │  - Events: eeg:data, etc       │
│  - Rate Limiting      │  - Room-based broadcasting     │
│  - Game Commands      │  - Python WS Client            │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           │ SQL Queries          │ WebSocket Client
           │ (PostgreSQL)         │ (Conecta ao Python)
           ▼                      ▼
┌─────────────────────┐  ┌─────────────────────────────┐
│  Supabase PostgreSQL│  │ SERVIDOR PYTHON EEG         │
├─────────────────────┤  │ (SSH Linux - Porta 8080)    │
│ - users, classes    │  ├─────────────────────────────┤
│ - sessions          │  │ server_headless-V4.py       │
│ - eeg_data          │  │ - WebSocket Server          │
│ - session_metrics   │  │ - Recebe dados de alunos    │
│ - student_metrics   │  │ - Salva CSV automático      │
│ - RLS Policies      │  │ - Redistribui para dashboards│
└─────────────────────┘  └─────────────────────────────┘
                              ▲
                              │ WebSocket
                              │ (ws://IP:8080)
                              │
                    ┌─────────┴───────────┐
                    │  biosync-atualizado  │
                    │   (Monitor Gráfico)  │
                    ├──────────────────────┤
                    │  - PySide6 Qt GUI    │
                    │  - Leitura Serial    │
                    │  - Parser ThinkGear  │
                    │  - Gráficos Matplotlib│
                    │  - WebSocket Server  │
                    └──────────▲───────────┘
                               │
                               │ Bluetooth Serial
                               │ (porta COM/USB)
                               │
                      ┌────────┴────────┐
                      │ HEADSET EEG TGAM│
                      │   (Bluetooth)    │
                      └──────────────────┘
```

---

## Diagrama de Arquitetura

### Arquitetura de Alto Nível

```
                      ┌──────────────┐
                      │   Internet   │
                      └──────┬───────┘
                             │
          ┌──────────────────┼────────────────────┐
          │                  │                    │
┌─────────▼──────┐ ┌─────────▼─────────┐ ┌───────▼────────┐
│  Vercel (CDN)  │ │   Render.com      │ │  Servidor SSH  │
│   Frontend     │ │   Backend API     │ │  Python EEG    │
│   (React PWA)  │ │   (Node.js)       │ │  (porta 8080)  │
└─────────┬──────┘ └─────────┬─────────┘ └───────┬────────┘
          │                  │                    │
          │                  │   ┌────────────────┘
          │                  │   │
          │         ┌────────▼───▼────┐
          │         │    Supabase     │
          └────────>│   PostgreSQL    │
                    └─────────────────┘

Fluxo de Dados EEG:
[Headset EEG] → [PWA Aluno via Bluetooth] → [Servidor Python SSH]
                                               ↓
                                    [Backend Node.js]
                                               ↓
                                    [Supabase PostgreSQL]
```

### Fluxo de Autenticação

```
┌─────────┐          ┌─────────┐          ┌──────────┐
│ Cliente │          │ Backend │          │ Database │
└────┬────┘          └────┬────┘          └────┬─────┘
     │                    │                     │
     │ POST /auth/login   │                     │
     ├───────────────────>│                     │
     │                    │ SELECT user         │
     │                    ├────────────────────>│
     │                    │<────────────────────┤
     │                    │ bcrypt.compare      │
     │                    │                     │
     │ { accessToken,     │                     │
     │   refreshToken }   │                     │
     │<───────────────────┤                     │
     │                    │                     │
     │ GET /api/data      │                     │
     │ Authorization:     │                     │
     │ Bearer <token>     │                     │
     ├───────────────────>│                     │
     │                    │ jwt.verify()        │
     │                    │                     │
     │                    │ SELECT data         │
     │                    ├────────────────────>│
     │                    │<────────────────────┤
     │ { data }           │                     │
     │<───────────────────┤                     │
```

---

## Camadas do Sistema

### 1. Frontend Layer (Apresentação)

**Web Admin (React + Material-UI)**
```
src/
├── pages/
│   ├── direction/       # Páginas da Direção
│   ├── teacher/         # Páginas do Professor
│   └── student/         # Páginas do Aluno (web)
├── components/
│   ├── common/          # Componentes reutilizáveis
│   ├── charts/          # Gráficos (Recharts)
│   └── forms/           # Formulários
├── contexts/
│   ├── AuthContext      # Autenticação
│   └── ThemeContext     # Tema light/dark
├── services/
│   ├── api.js           # REST client (Axios)
│   └── websocket.js     # WebSocket client
└── theme/
    ├── lightTheme.js
    └── darkTheme.js
```

**PWA Mobile (React + TypeScript)**
```
src/
├── pages/
│   ├── StudentDashboard.tsx
│   ├── SessionActive.tsx
│   └── EEGConnection.tsx
├── services/
│   ├── bluetoothEEG.ts  # Web Bluetooth API
│   ├── thinkgearParser.ts # Parser protocolo
│   └── websocket.ts     # Real-time
└── components/
    ├── AttentionIndicator.tsx  # Bolinha verde/vermelha
    └── EEGStatus.tsx           # Qualidade sinal
```

---

### 2. Servidor Python EEG (Ponte de Dados)

**Servidor Headless (server_headless-V4.py)**
```python
# Servidor WebSocket em Python
# Porta: 8080
# Função: Recebe dados EEG e redistribui

server_headless-V4.py
├── ServidorWebSocketHeadless
│   ├── get_local_ip()         # Detecta IP local
│   ├── echo(websocket)        # Handler conexões
│   │   ├── Identifica "dash"   # Cliente dashboard
│   │   └── Processa JSON EEG   # Cliente aluno
│   ├── Salva CSV automático
│   └── Redistribui para dashboards

# CSV gerado:
{Nome}.csv
Att,Med,Delta,Theta,LowAlpha,HighAlpha,LowBeta,HighBeta,LowGamma,MiddleGamma
85,72,123456,234567,345678,456789,567890,678901,789012,890123
...
```

**Monitor Gráfico (biosync-atualizado/)**
```
biosync-atualizado/
├── main.py              # Aplicação Qt principal
├── parser.py            # Parser ThinkGear
├── graphs.py            # Gráficos Matplotlib
├── connect_page.py      # Tela conexão serial
└── utils.py             # Helpers

Funcionalidades:
- Conecta via Serial (COM/USB) ao headset EEG
- Parse protocolo ThinkGear (sync bytes, checksum)
- Visualiza gráficos em tempo real (50 últimos pontos)
- Servidor WebSocket integrado (porta 8080)
- Envia dados a cada 1 segundo
```

**Deploy (Servidor SSH Linux)**
```
/opt/neuroone/
├── venv/                   # Python virtual environment
├── server_headless-V4.py   # Servidor
└── *.csv                   # CSVs gerados

Systemd/Supervisor:
- Auto-start no boot
- Auto-restart em caso de crash
- Logs: /var/log/neuroone-ws.log

Firewall:
- Porta 8080 aberta (TCP)
```

---

### 3. Backend Layer (Lógica de Negócio)

```
src/
├── controllers/
│   ├── authController.js
│   ├── directionController.js
│   ├── teacherController.js
│   └── studentController.js
├── routes/
│   ├── auth.js
│   ├── direction.js
│   ├── teacher.js
│   └── student.js
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── rateLimitMiddleware.js
├── services/
│   ├── websocket.js         # Socket.io
│   ├── metricsCalculator.js # Cálculos
│   └── reportGenerator.js   # PDF/CSV
└── utils/
    ├── jwt.js
    └── validators.js
```

---

### 3. Data Layer (Persistência)

**Supabase PostgreSQL**
- Row Level Security (RLS)
- Triggers para updated_at
- Índices otimizados
- Particionamento (eeg_data)

---

## Fluxo de Dados

### Fluxo de Sessão Completo

```
1. PROFESSOR CRIA SESSÃO
   │
   ├─> Frontend: POST /api/teacher/sessions
   │   Body: { title, type, class_id }
   │
   ├─> Backend: teacherController.createSession()
   │   - Valida dados
   │   - Insere em 'sessions'
   │
   └─> Database: INSERT INTO sessions

2. PROFESSOR INICIA SESSÃO
   │
   ├─> Frontend: POST /api/teacher/sessions/:id/start
   │
   ├─> Backend: teacherController.startSession()
   │   - Atualiza status = 'active'
   │   - Conecta ao WebSocket
   │
   └─> WebSocket: teacher:join room

3. ALUNO ENTRA NA SESSÃO
   │
   ├─> Mobile: Conecta Bluetooth EEG
   │   - Scan devices
   │   - Connect
   │   - StartNotifications
   │
   ├─> Mobile: Entra no WebSocket
   │   - socket.emit('student:join', { sessionId, studentId })
   │
   └─> Backend: Notifica professor
       - socket.to(room).emit('student:connected')

4. TRANSMISSÃO DE DADOS EEG
   │
   ├─> Mobile: Loop contínuo
   │   - Recebe dados brutos do Bluetooth
   │   - Processa FFT
   │   - Calcula atenção/relaxamento
   │   - socket.emit('eeg:data', { ...data })
   │
   ├─> Backend: Recebe dados
   │   - Salva no banco (eeg_data)
   │   - Broadcast para professor
   │   - socket.to(room).emit('eeg:update')
   │
   └─> Frontend Professor: Atualiza UI em tempo real

5. PROFESSOR ENCERRA SESSÃO
   │
   ├─> Frontend: POST /api/teacher/sessions/:id/end
   │
   ├─> Backend: teacherController.endSession()
   │   - Atualiza status = 'completed'
   │   - Calcula métricas agregadas
   │   - Insere em session_metrics
   │   - Insere em student_metrics
   │
   └─> Database: Métricas salvas
```

---

## Comunicação em Tempo Real

### WebSocket (Socket.io)

**Namespace:** `/sessions`

**Events:**

#### Professor → Server

```javascript
// Entrar na sala da sessão
socket.emit('teacher:join', {
  sessionId: 'uuid',
  teacherId: 'uuid'
});
```

#### Aluno → Server

```javascript
// Entrar na sessão
socket.emit('student:join', {
  sessionId: 'uuid',
  studentId: 'uuid'
});

// Enviar dados EEG
socket.emit('eeg:data', {
  sessionId: 'uuid',
  studentId: 'uuid',
  timestamp: Date,
  attention: 75,
  relaxation: 68,
  delta: 0.15,
  theta: 0.22,
  alpha: 0.65,
  beta: 0.45,
  gamma: 0.08
});
```

#### Server → Professor

```javascript
// Aluno conectou
socket.on('student:connected', (data) => {
  // { studentId, timestamp }
});

// Atualização EEG
socket.on('eeg:update', (data) => {
  // { studentId, attention, relaxation, timestamp }
});

// Aluno desconectou
socket.on('student:disconnected', (data) => {
  // { studentId, timestamp }
});
```

---

## Segurança

### Autenticação (JWT)

```javascript
// Access Token (15 minutos)
{
  "userId": "uuid",
  "email": "user@school.com",
  "role": "professor",
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token (7 dias)
{
  "userId": "uuid",
  "tokenId": "uuid",
  "iat": 1234567890,
  "exp": 1235177490
}
```

### Autorização (RBAC)

**Direção:**
- ✅ Acesso total
- ✅ CRUD usuários
- ✅ CRUD turmas
- ✅ Ver todas sessões
- ✅ Ver todos dados EEG

**Professor:**
- ✅ CRUD suas sessões
- ✅ Ver alunos de suas turmas
- ✅ Ver dados EEG de suas sessões
- ❌ Não pode ver outras turmas

**Aluno:**
- ✅ Ver suas sessões
- ✅ Ver seus dados EEG
- ✅ Enviar dados EEG
- ❌ Não pode ver outros alunos

### Rate Limiting

```javascript
// Geral
100 requests / 15 minutos

// Login
5 requests / 15 minutos

// EEG Data
1000 requests / 1 minuto (high throughput)
```

### Row Level Security (RLS)

```sql
-- Exemplo: Aluno só vê seus dados
CREATE POLICY "aluno_view_own_eeg" ON eeg_data
  FOR SELECT
  USING (student_id = auth.uid());
```

---

## Escalabilidade

### Horizontal Scaling

```
┌─────────────┐
│   Vercel    │  → CDN global, auto-scaling
└─────────────┘

┌─────────────┐
│   Render    │  → Multi-instance (2+ backends)
└─────────────┘

┌─────────────┐
│  Supabase   │  → Managed PostgreSQL com pooling
└─────────────┘
```

### Database Optimization

**Particionamento (eeg_data):**
```sql
-- Particionar por mês
CREATE TABLE eeg_data_2025_11 PARTITION OF eeg_data
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**Connection Pooling:**
```javascript
// Supabase client com pool
const supabase = createClient(url, key, {
  db: {
    pool: {
      min: 2,
      max: 10
    }
  }
});
```

### Caching (Futuro)

```
┌─────────────┐
│    Redis    │  → Cache de sessões ativas
│             │  → Cache de métricas
└─────────────┘
```

---

## Tecnologias por Camada

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend Web** | React 18 + Material-UI | Ecosystem maduro, componentes prontos |
| **Frontend Mobile** | Capacitor 7 | Cross-platform, Web APIs |
| **Backend** | Node.js 18 + Express | Assíncrono, bom para WebSocket |
| **Real-time** | Socket.io | Fallback automático, rooms |
| **Database** | PostgreSQL 17 | Relacional, ACID, RLS |
| **Auth** | JWT | Stateless, escalável |
| **Deploy Frontend** | Vercel | CDN global, auto-deploy |
| **Deploy Backend** | Render | Fácil setup, auto-scale |

---

## Documentos Relacionados

- [04-DATABASE-SCHEMA.md](./04-DATABASE-SCHEMA.md) - Schema do banco
- [05-API-ENDPOINTS.md](./05-API-ENDPOINTS.md) - Endpoints REST
- [06-WEBSOCKET-SPEC.md](./06-WEBSOCKET-SPEC.md) - WebSocket events

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
