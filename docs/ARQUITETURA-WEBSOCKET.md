# NeuroOne - Documentacao de Arquitetura WebSocket

> Documentacao tecnica do sistema de neurofeedback educacional em tempo real.
> Ultima atualizacao: Novembro 2025

---

## 1. Visao Geral do Sistema

O NeuroOne e um sistema educacional de neurofeedback que monitora a atencao e relaxamento dos alunos em tempo real usando dispositivos EEG (MindWave).

### 1.1 Stack Tecnologico

| Componente | Tecnologia | Versao |
|------------|------------|--------|
| **Frontend** | React + Vite | 18.x |
| **Backend** | Node.js + Express | 18.x |
| **WebSocket** | Socket.IO | 4.x |
| **Database** | Supabase (PostgreSQL) | - |
| **Auth** | Supabase Auth (JWT) | - |
| **EEG Device** | MindWave Mobile | - |
| **3D Games** | Three.js | - |

### 1.2 Diagrama de Arquitetura

```
+-----------------------------------------------------------+
|                    CLIENTE (Browser)                       |
|                                                            |
|  +-------------+  +-------------+  +-----------------+     |
|  | React App   |  | 3D Games    |  | Monitor Web     |     |
|  | (Professor) |  | (Fazendinha)|  | (EEG)           |     |
|  +------+------+  +------+------+  +--------+--------+     |
|         |                |                  |              |
|         +----------------+------------------+              |
|                          |                                 |
|               WebSocket (Socket.IO)                        |
+-----------------------------------------------------------+
                           |
              +------------+------------+
              |   HTTPS / WSS           |
              |   Port: 443 (Render)    |
              +------------+------------+
                           |
+-----------------------------------------------------------+
|                    BACKEND (Node.js)                       |
|                                                            |
|  +-------------+  +-------------+  +-----------------+     |
|  | Socket.IO   |  | Express     |  | Services        |     |
|  | Server      |  | API Routes  |  | (DB, Auth)      |     |
|  +-------------+  +-------------+  +-----------------+     |
|                                                            |
|  +-------------+  +-------------+  +-----------------+     |
|  | Handlers    |  | Middleware  |  | Rate Limiter    |     |
|  | (Teacher/   |  | (Auth/JWT)  |  | (300 req/min)   |     |
|  |  Student)   |  |             |  |                 |     |
|  +-------------+  +-------------+  +-----------------+     |
+-----------------------------------------------------------+
                           |
              +------------+------------+
              |   Supabase REST API     |
              |   PostgreSQL Database   |
              +-------------------------+
```

---

## 2. Deploy em Producao

### 2.1 Ambientes

| Servico | Plataforma | URL |
|---------|------------|-----|
| **Frontend** | Vercel | https://neuroone.jogosadm.com.br |
| **Backend** | Render | https://biosync-jlfh.onrender.com |
| **Database** | Supabase | https://fsszpnbuabhhvrdmrtct.supabase.co |

### 2.2 Configuracao Vercel (Frontend)

**Repositorio**: GitHub conectado
**Branch**: master
**Build Command**: `npm run build`
**Output Directory**: `dist`

**Variaveis de Ambiente**:
```env
VITE_API_URL=https://biosync-jlfh.onrender.com
VITE_WS_URL=wss://biosync-jlfh.onrender.com
VITE_SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 2.3 Configuracao Render (Backend)

**Repositorio**: GitHub conectado
**Branch**: master
**Root Directory**: `neuroone-backend`
**Build Command**: `npm install`
**Start Command**: `npm start`

**Variaveis de Ambiente**:
```env
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://neuroone.jogosadm.com.br,https://neuroone.vercel.app
SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

### 2.4 Configuracao Supabase (Database)

**Projeto**: fsszpnbuabhhvrdmrtct
**Regiao**: South America (São Paulo)

**Tabelas Principais**:
- `users` - Usuarios do sistema
- `classes` - Turmas
- `sessions` - Sessoes de neurofeedback
- `eeg_data` - Dados EEG em tempo real
- `session_participants` - Alunos por sessao

---

## 3. WebSocket / Socket.IO

### 3.1 Configuracao do Servidor

**Arquivo**: `neuroone-backend/src/server.js`

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});
```

### 3.2 Autenticacao JWT

O Socket.IO usa middleware para validar tokens JWT do Supabase:

```javascript
io.use(socketAuthMiddleware);

// Middleware valida:
// 1. Token no handshake (auth.token ou query.token)
// 2. Verificacao com Supabase Auth
// 3. Anexa usuario ao socket (socket.user)
```

**Fluxo de Autenticacao**:
1. Cliente faz login via Supabase Auth
2. Recebe token JWT
3. Envia token na conexao Socket.IO
4. Middleware valida e anexa user ao socket
5. Conexao estabelecida ou rejeitada

### 3.3 Eventos WebSocket

#### Eventos do Professor (Teacher)

| Evento | Direcao | Payload | Descricao |
|--------|---------|---------|-----------|
| `teacher:join` | Cliente -> Servidor | `{ sessionId }` | Entra na sessao |
| `teacher:joined` | Servidor -> Cliente | `{ sessionId, session }` | Confirmacao |
| `teacher:leave` | Cliente -> Servidor | `{ sessionId }` | Sai da sessao |
| `teacher:get-students` | Cliente -> Servidor | `{ sessionId }` | Lista alunos |
| `teacher:students` | Servidor -> Cliente | `{ students: [...] }` | Lista com status |

#### Eventos do Aluno (Student)

| Evento | Direcao | Payload | Descricao |
|--------|---------|---------|-----------|
| `student:join` | Cliente -> Servidor | `{ sessionId, studentId, studentName }` | Entra na sessao |
| `student:joined` | Servidor -> Cliente | `{ sessionId, session }` | Confirmacao |
| `student:leave` | Cliente -> Servidor | `{ sessionId }` | Sai da sessao |
| `student:connected` | Servidor -> Room | `{ studentId, studentName }` | Notifica professores |
| `student:disconnected` | Servidor -> Room | `{ studentId }` | Notifica professores |

#### Eventos EEG (Dados Biometricos)

| Evento | Direcao | Payload | Descricao |
|--------|---------|---------|-----------|
| `eeg:data` | Cliente -> Servidor | `{ attention, relaxation, ... }` | Dados do MindWave |
| `eeg:update` | Servidor -> Room | `{ studentId, attention, ... }` | Broadcast para professores |
| `eeg:received` | Servidor -> Cliente | `{ timestamp }` | Confirmacao |
| `eeg:invalid-data` | Servidor -> Cliente | `{ message }` | Dados rejeitados |

### 3.4 Rate Limiting

| Evento | Max Requests | Janela | Taxa |
|--------|--------------|--------|------|
| `eeg:data` | 300 | 60s | 5 Hz |
| `student:join` | 5 | 60s | - |
| `teacher:join` | 5 | 60s | - |
| `teacher:get-students` | 30 | 60s | - |

---

## 4. Monitor EEG Web

### 4.1 Localizacao

**Arquivo**: `neuroone-backend/public/monitor/eeg-monitor.html`

**URL de Acesso**:
```
https://biosync-jlfh.onrender.com/monitor/eeg-monitor.html
  ?sessionId=XXX
  &studentId=YYY
  &studentName=NOME
  &token=JWT_TOKEN
```

### 4.2 Integracao MindWave via Bluetooth

O monitor usa a Web Bluetooth API para conectar ao headset:

```javascript
// Solicitar dispositivo Bluetooth
const device = await navigator.bluetooth.requestDevice({
  filters: [{ name: 'MindWave Mobile' }]
});

// Conectar ao GATT Server
const server = await device.gatt.connect();

// Acessar servico e caracteristica
const service = await server.getPrimaryService('0000ffe0-...');
const char = await service.getCharacteristic('0000ffe1-...');

// Ler dados continuamente
char.addEventListener('characteristicvaluechanged', onData);
await char.startNotifications();
```

### 4.3 Protocolo ThinkGear

O MindWave envia pacotes no formato ThinkGear:

```
Formato do Pacote:
+------+------+------+---------------+----------+
| 0xAA | 0xAA | Len  |   Payload     | Checksum |
+------+------+------+---------------+----------+
|  1B  |  1B  |  1B  |   Len bytes   |    1B    |
+------+------+------+---------------+----------+

Tipos de Dados no Payload:
0x04 = Attention (0-100)
0x05 = Meditation (0-100)
0x80 = Raw Wave (16-bit)
0x83 = EEG Power Bands
```

### 4.4 Fluxo de Dados

```
MindWave Headset
      |
      | Bluetooth GATT
      v
Monitor Web (Browser)
      |
      | parseThinkGearPacket()
      | Extrai: Attention, Meditation, Bands
      v
Socket.IO Client
      |
      | emit('eeg:data', {...})
      | Taxa: 5 Hz (200ms)
      v
Backend (Node.js)
      |
      | handleEEGData()
      | Valida + Salva + Broadcast
      v
Supabase (PostgreSQL)
      |
      | INSERT INTO eeg_data
      v
Dashboard Professor
      |
      | on('eeg:update')
      | Atualiza UI em tempo real
```

---

## 5. Jogos de Neurofeedback

### 5.1 Jogo Fazendinha

**Localizacao**: `neuroone-backend/public/games/fazendinha/`

**URL de Acesso**:
```
https://biosync-jlfh.onrender.com/games/fazendinha/
  ?sessionId=XXX
  &studentId=YYY
  &studentName=NOME
  &token=JWT_TOKEN
```

### 5.2 Integracao com Neurofeedback

Os dados EEG afetam a gameplay:

```javascript
// Atencao alta = movimento mais rapido
if (eegData.attention > 70) {
  playerSpeed = SPEED * 1.2;
}

// Relaxamento alto = efeitos duram mais
if (eegData.relaxation > 70) {
  effectDuration *= 1.5;
}
```

### 5.3 Tecnologia

- **Engine**: Three.js (3D WebGL)
- **Comunicacao**: Socket.IO
- **EEG**: Web Bluetooth API

---

## 6. Fluxo Completo de Dados EEG

### 6.1 Ciclo de Vida

```
1. CAPTURA (MindWave)
   +---------------------------+
   | Sensores EEG              |
   | - Attention (0-100)       |
   | - Meditation (0-100)      |
   | - Delta, Theta, Alpha...  |
   | - Signal Quality          |
   +---------------------------+
              |
              v
2. DECODIFICACAO (Browser)
   +---------------------------+
   | parseThinkGearPacket()    |
   | - Sync: 0xAA 0xAA         |
   | - Valida checksum         |
   | - Extrai valores          |
   +---------------------------+
              |
              v
3. ENVIO (Socket.IO)
   +---------------------------+
   | emit('eeg:data', {        |
   |   attention: 65,          |
   |   relaxation: 72,         |
   |   delta: 1200,            |
   |   theta: 980,             |
   |   alpha: 1975,            |
   |   beta: 2100,             |
   |   gamma: 1045,            |
   |   signalQuality: 50       |
   | })                        |
   | Taxa: 5 Hz                |
   +---------------------------+
              |
              v
4. PROCESSAMENTO (Backend)
   +---------------------------+
   | handleEEGData()           |
   | - Valida dados            |
   | - Atualiza room state     |
   | - Salva em BD (async)     |
   | - Broadcast para room     |
   +---------------------------+
              |
              v
5. ARMAZENAMENTO (Supabase)
   +---------------------------+
   | INSERT INTO eeg_data      |
   | - session_id              |
   | - student_id              |
   | - timestamp               |
   | - attention, relaxation   |
   | - delta, theta, alpha...  |
   +---------------------------+
              |
              v
6. EXIBICAO (Dashboard)
   +---------------------------+
   | on('eeg:update')          |
   | - Atualiza graficos       |
   | - Mostra status alunos    |
   | - Alertas se necessario   |
   +---------------------------+
```

### 6.2 Frequencias de Banda EEG

| Banda | Frequencia | Significado |
|-------|------------|-------------|
| Delta | 0.5-3 Hz | Sono profundo |
| Theta | 4-8 Hz | Criatividade, meditacao |
| Alpha | 8-12 Hz | Relaxado, alerta |
| Beta | 12-30 Hz | Pensamento ativo |
| Gamma | 30-50 Hz | Aprendizado |

### 6.3 Indices eSense (MindWave)

**Attention (0-100)**:
- 0-40: Baixa concentracao
- 40-60: Normal
- 60-100: Alta concentracao

**Meditation (0-100)**:
- 0-40: Pouco relaxado
- 40-60: Normal
- 60-100: Muito relaxado

---

## 7. API REST

### 7.1 Endpoints Principais

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/classes` | Lista turmas |
| GET | `/api/classes/:id` | Detalhes da turma |
| POST | `/api/classes/create` | Cria turma |
| GET | `/api/sessions` | Lista sessoes |
| POST | `/api/sessions/create` | Cria sessao |
| GET | `/api/users` | Lista usuarios |
| POST | `/api/users/create` | Cria usuario |
| GET | `/api/metrics/sessions/:id` | Metricas da sessao |
| GET | `/health` | Health check |

### 7.2 Exemplo de Resposta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Turma 5A",
    "students": [...]
  }
}
```

---

## 8. Seguranca

### 8.1 Autenticacao
- JWT via Supabase Auth
- Validacao em cada conexao WebSocket
- Tokens expiram em 24h

### 8.2 Autorizacao
- Professor so acessa suas sessoes
- Aluno so acessa sessoes matriculado
- RLS (Row Level Security) no Supabase

### 8.3 Rate Limiting
- EEG: 300 req/min (5 Hz)
- Outros eventos: Limites especificos
- Por socket + evento

### 8.4 CORS
- Origins permitidos configurados
- Credentials habilitado
- Preflight OPTIONS tratado

---

## 9. Monitoramento

### 9.1 Health Check

**Endpoint**: `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2025-11-21T15:30:45Z",
  "uptime": 3600.5
}
```

### 9.2 Logs

O backend usa logger estruturado:
- `logger.info()` - Informacoes
- `logger.warn()` - Avisos
- `logger.error()` - Erros
- `logger.success()` - Sucesso

### 9.3 Debug Mode (Cliente)

```javascript
// Ativar logs detalhados
localStorage.setItem('DEBUG_MODE', 'true');

// Desativar
localStorage.removeItem('DEBUG_MODE');
```

---

## 10. Troubleshooting

### 10.1 Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| `Invalid token` | JWT expirado | Fazer login novamente |
| `Rate limit exceeded` | Muitos eventos | Aguardar 60s |
| `Session not found` | ID invalido | Verificar URL |
| `Device disconnected` | MindWave offline | Reconectar Bluetooth |
| `CORS error` | Origin nao permitido | Verificar ALLOWED_ORIGINS |

### 10.2 Reconexao WebSocket

O cliente tenta reconectar automaticamente:
- 5 tentativas
- Delay exponencial: 1s -> 5s
- Fallback para HTTP polling

---

## 11. Contatos

**Desenvolvimento**: NeuroOne Team
**Suporte**: suporte@neuroone.com.br

---

*Documento gerado automaticamente - Claude Code*
