# 05 - API ENDPOINTS E WEBSOCKET

## Índice
1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Usuários](#usuários)
4. [Turmas](#turmas)
5. [Sessões](#sessões)
6. [Dados EEG](#dados-eeg)
7. [Relatórios](#relatórios)
8. [WebSocket - Servidor Python](#websocket-servidor-python)
9. [WebSocket - Backend Node.js](#websocket-backend-nodejs)
10. [Códigos de Status](#códigos-de-status)

---

## Visão Geral

### Base URLs

```
Backend Node.js (REST API):
- Desenvolvimento: http://localhost:3000/api/v1
- Produção: https://biosync-jlfh.onrender.com/api/v1

Servidor Python WebSocket:
- Desenvolvimento: ws://localhost:8080
- Produção: ws://<IP_SSH_SERVER>:8080

Backend Node.js WebSocket:
- Desenvolvimento: ws://localhost:3001
- Produção: wss://biosync-jlfh.onrender.com/ws
```

### Autenticação

Todos os endpoints (exceto `/auth/login` e `/auth/register`) requerem:

```http
Authorization: Bearer <access_token>
```

### Headers Padrão

```http
Content-Type: application/json
Accept: application/json
```

---

## Autenticação

### POST /auth/register
Criar nova conta de usuário.

**Request:**
```json
{
  "email": "aluno@escola.com",
  "username": "joao_silva",
  "password": "Senha123!",
  "name": "João Silva",
  "user_role": "aluno"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "aluno@escola.com",
    "username": "joao_silva",
    "name": "João Silva",
    "user_role": "aluno",
    "avatar_url": null,
    "created_at": "2025-01-15T10:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/login
Fazer login.

**Request:**
```json
{
  "email": "professor@escola.com",
  "password": "Senha123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "professor@escola.com",
    "username": "prof_maria",
    "name": "Maria Santos",
    "user_role": "professor",
    "avatar_url": "https://...",
    "active": true
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/refresh
Renovar access token usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900
}
```

---

### POST /auth/logout
Fazer logout (invalida refresh token).

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## Usuários

### GET /users
Listar usuários (com filtros).

**Query Parameters:**
- `role` - Filtrar por papel (direção, professor, aluno)
- `active` - Filtrar por status (true/false)
- `search` - Buscar por nome ou email
- `page` - Número da página (default: 1)
- `limit` - Itens por página (default: 20)

**Exemplo:**
```
GET /users?role=aluno&active=true&search=joão&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "aluno@escola.com",
      "username": "joao_silva",
      "name": "João Silva",
      "user_role": "aluno",
      "avatar_url": "https://...",
      "active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### GET /users/:id
Obter detalhes de um usuário.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "aluno@escola.com",
  "username": "joao_silva",
  "name": "João Silva",
  "user_role": "aluno",
  "avatar_url": "https://...",
  "active": true,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z",
  "classes": [
    {
      "id": "uuid",
      "name": "7º Ano A",
      "school_year": "2025"
    }
  ],
  "stats": {
    "total_sessions": 12,
    "avg_attention": 78,
    "avg_relaxation": 65
  }
}
```

---

### POST /users
Criar novo usuário (apenas Direção).

**Request:**
```json
{
  "email": "novo@escola.com",
  "username": "novo_usuario",
  "password": "Senha123!",
  "name": "Novo Usuário",
  "user_role": "aluno"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "novo@escola.com",
  "username": "novo_usuario",
  "name": "Novo Usuário",
  "user_role": "aluno",
  "avatar_url": null,
  "active": true,
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

### PUT /users/:id
Atualizar usuário.

**Request:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.novo@escola.com",
  "active": true,
  "avatar_url": "https://..."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "João Silva Santos",
  "email": "joao.novo@escola.com",
  "active": true,
  "updated_at": "2025-01-20T15:00:00Z"
}
```

---

### DELETE /users/:id
Desativar usuário (soft delete).

**Response (200 OK):**
```json
{
  "message": "Usuário desativado com sucesso"
}
```

---

## Turmas

### GET /classes
Listar turmas.

**Query Parameters:**
- `teacher_id` - Filtrar por professor
- `school_year` - Filtrar por ano letivo
- `active` - Filtrar por status (true/false)

**Response (200 OK):**
```json
{
  "classes": [
    {
      "id": "uuid",
      "name": "7º Ano A",
      "school_year": "2025",
      "teacher": {
        "id": "uuid",
        "name": "Maria Santos"
      },
      "student_count": 28,
      "created_at": "2025-01-10T08:00:00Z"
    }
  ]
}
```

---

### GET /classes/:id
Obter detalhes de uma turma.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "7º Ano A",
  "school_year": "2025",
  "description": "Turma matutina",
  "teacher": {
    "id": "uuid",
    "name": "Maria Santos",
    "email": "maria@escola.com"
  },
  "students": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@escola.com",
      "enrolled_at": "2025-01-10T08:00:00Z"
    }
  ],
  "sessions": [
    {
      "id": "uuid",
      "title": "Matemática - Frações",
      "scheduled_at": "2025-01-20T10:00:00Z",
      "status": "completed"
    }
  ]
}
```

---

### POST /classes
Criar nova turma (Professor ou Direção).

**Request:**
```json
{
  "name": "8º Ano B",
  "school_year": "2025",
  "description": "Turma vespertina",
  "teacher_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "8º Ano B",
  "school_year": "2025",
  "description": "Turma vespertina",
  "created_by": "uuid",
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

### POST /classes/:id/students
Adicionar alunos à turma.

**Request:**
```json
{
  "student_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200 OK):**
```json
{
  "message": "3 alunos adicionados com sucesso",
  "added": 3,
  "already_enrolled": 0
}
```

---

### DELETE /classes/:id/students/:student_id
Remover aluno da turma.

**Response (200 OK):**
```json
{
  "message": "Aluno removido da turma"
}
```

---

## Sessões

### GET /sessions
Listar sessões.

**Query Parameters:**
- `teacher_id` - Filtrar por professor
- `class_id` - Filtrar por turma
- `status` - Filtrar por status (scheduled, active, completed, cancelled)
- `date_from` - Data inicial (ISO 8601)
- `date_to` - Data final (ISO 8601)

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Matemática - Equações",
      "description": "Aula sobre equações de 1º grau",
      "session_type": "monitoramento",
      "status": "active",
      "teacher": {
        "id": "uuid",
        "name": "Maria Santos"
      },
      "class": {
        "id": "uuid",
        "name": "7º Ano A"
      },
      "scheduled_at": "2025-01-20T10:00:00Z",
      "started_at": "2025-01-20T10:05:00Z",
      "participants_count": 25,
      "avg_attention": 82,
      "avg_relaxation": 68
    }
  ]
}
```

---

### GET /sessions/:id
Obter detalhes de uma sessão.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Matemática - Equações",
  "description": "Aula sobre equações de 1º grau",
  "session_type": "monitoramento",
  "status": "active",
  "teacher": {
    "id": "uuid",
    "name": "Maria Santos",
    "email": "maria@escola.com"
  },
  "class": {
    "id": "uuid",
    "name": "7º Ano A"
  },
  "game": {
    "id": "uuid",
    "name": "Autorama",
    "enabled": true
  },
  "scheduled_at": "2025-01-20T10:00:00Z",
  "started_at": "2025-01-20T10:05:00Z",
  "ended_at": null,
  "participants": [
    {
      "student_id": "uuid",
      "student_name": "João Silva",
      "connected_at": "2025-01-20T10:06:00Z",
      "status": "connected",
      "current_attention": 85,
      "current_relaxation": 72,
      "avg_attention": 82,
      "avg_relaxation": 68,
      "total_data_points": 145
    }
  ],
  "metrics": {
    "total_participants": 25,
    "connected_participants": 23,
    "avg_attention": 82,
    "avg_relaxation": 68,
    "duration_minutes": 35
  }
}
```

---

### POST /sessions
Criar nova sessão (Professor).

**Request:**
```json
{
  "title": "Matemática - Equações",
  "description": "Aula sobre equações de 1º grau",
  "session_type": "monitoramento",
  "class_id": "uuid",
  "game_id": "uuid",
  "scheduled_at": "2025-01-20T10:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "title": "Matemática - Equações",
  "session_type": "monitoramento",
  "status": "scheduled",
  "scheduled_at": "2025-01-20T10:00:00Z",
  "created_at": "2025-01-18T14:00:00Z"
}
```

---

### POST /sessions/:id/start
Iniciar sessão.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "active",
  "started_at": "2025-01-20T10:05:00Z",
  "websocket_url": "ws://localhost:3001/sessions/uuid"
}
```

---

### POST /sessions/:id/end
Encerrar sessão.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "completed",
  "started_at": "2025-01-20T10:05:00Z",
  "ended_at": "2025-01-20T11:30:00Z",
  "duration_minutes": 85,
  "metrics": {
    "total_participants": 25,
    "avg_attention": 82,
    "avg_relaxation": 68,
    "total_data_points": 12750
  }
}
```

---

### GET /sessions/:id/report
Obter relatório detalhado da sessão.

**Response (200 OK):**
```json
{
  "session": {
    "id": "uuid",
    "title": "Matemática - Equações",
    "duration_minutes": 85
  },
  "overall_metrics": {
    "total_participants": 25,
    "avg_attention": 82,
    "avg_relaxation": 68,
    "peak_attention": 95,
    "lowest_attention": 45
  },
  "students": [
    {
      "id": "uuid",
      "name": "João Silva",
      "metrics": {
        "avg_attention": 85,
        "avg_relaxation": 72,
        "peak_attention": 98,
        "total_time_minutes": 82,
        "data_points": 492
      },
      "waves": {
        "avg_delta": 123456,
        "avg_theta": 234567,
        "avg_alpha": 345678,
        "avg_beta": 456789,
        "avg_gamma": 567890
      }
    }
  ],
  "timeline": [
    {
      "timestamp": "2025-01-20T10:05:00Z",
      "avg_attention": 75,
      "avg_relaxation": 65
    }
  ]
}
```

---

## Dados EEG

### POST /eeg/data
Salvar dados EEG (batch).

**Request:**
```json
{
  "session_id": "uuid",
  "student_id": "uuid",
  "data": [
    {
      "timestamp": "2025-01-20T10:10:00.000Z",
      "attention": 85,
      "relaxation": 72,
      "delta": 123456,
      "theta": 234567,
      "low_alpha": 345678,
      "high_alpha": 456789,
      "low_beta": 567890,
      "high_beta": 678901,
      "low_gamma": 789012,
      "middle_gamma": 890123
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Dados EEG salvos com sucesso",
  "count": 1
}
```

---

### GET /eeg/data
Obter dados EEG (com filtros).

**Query Parameters:**
- `session_id` - Filtrar por sessão
- `student_id` - Filtrar por aluno
- `date_from` - Data inicial
- `date_to` - Data final
- `limit` - Limite de registros (default: 1000)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "student_id": "uuid",
      "timestamp": "2025-01-20T10:10:00.000Z",
      "attention": 85,
      "relaxation": 72,
      "delta": 123456,
      "theta": 234567,
      "low_alpha": 345678,
      "high_alpha": 456789,
      "low_beta": 567890,
      "high_beta": 678901,
      "low_gamma": 789012,
      "middle_gamma": 890123
    }
  ],
  "count": 1245
}
```

---

## Relatórios

### GET /reports/student/:student_id
Relatório completo de um aluno.

**Query Parameters:**
- `date_from` - Data inicial
- `date_to` - Data final

**Response (200 OK):**
```json
{
  "student": {
    "id": "uuid",
    "name": "João Silva"
  },
  "period": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "summary": {
    "total_sessions": 12,
    "total_hours": 18.5,
    "avg_attention": 82,
    "avg_relaxation": 68,
    "improvement_attention": 15,
    "improvement_relaxation": 8
  },
  "sessions": [
    {
      "id": "uuid",
      "title": "Matemática - Equações",
      "date": "2025-01-20T10:05:00Z",
      "duration_minutes": 85,
      "avg_attention": 85,
      "avg_relaxation": 72
    }
  ],
  "evolution": {
    "attention": [
      { "date": "2025-01-01", "value": 70 },
      { "date": "2025-01-08", "value": 75 },
      { "date": "2025-01-15", "value": 80 },
      { "date": "2025-01-22", "value": 82 }
    ]
  }
}
```

---

### GET /reports/class/:class_id
Relatório completo de uma turma.

**Query Parameters:**
- `date_from` - Data inicial
- `date_to` - Data final

**Response (200 OK):**
```json
{
  "class": {
    "id": "uuid",
    "name": "7º Ano A",
    "student_count": 28
  },
  "period": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "summary": {
    "total_sessions": 8,
    "avg_attention": 78,
    "avg_relaxation": 65,
    "top_students": [
      {
        "id": "uuid",
        "name": "João Silva",
        "avg_attention": 92
      }
    ],
    "students_needing_attention": [
      {
        "id": "uuid",
        "name": "Maria Oliveira",
        "avg_attention": 55
      }
    ]
  },
  "distribution": {
    "attention": {
      "0-20": 0,
      "21-40": 2,
      "41-60": 8,
      "61-80": 12,
      "81-100": 6
    }
  }
}
```

---

## WebSocket - Servidor Python

### Conexão

**URL:** `ws://<IP_SERVER>:8080`

**Não requer autenticação JWT** (conexão direta do dispositivo EEG)

### Eventos

#### Cliente → Servidor

**1. Identificação como Dashboard**
```json
"dash"
```

**2. Envio de Dados EEG**
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

#### Servidor → Dashboard

```json
{
  "ID": 1,
  "Nome": "Joao_Silva",
  "Codigo": "ABC123",
  "Att": 85,
  "Med": 72
}
```

### Comportamento

- **Salvamento CSV:** Servidor cria automaticamente arquivo `{Nome}.csv`
- **Múltiplas Conexões:** Suporta múltiplos alunos simultaneamente
- **ID Incremental:** Cada novo aluno recebe um ID único
- **Retransmissão:** Dados são enviados para dashboard em tempo real

---

## WebSocket - Backend Node.js

### Conexão

**URL:** `ws://localhost:3001` (dev) ou `wss://biosync-jlfh.onrender.com/ws` (prod)

**Autenticação:**
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: '<access_token>'
  }
});
```

### Eventos

#### Cliente → Servidor

**1. Entrar em Sessão (Professor)**
```javascript
socket.emit('teacher:join', {
  sessionId: 'uuid'
});
```

**2. Entrar em Sessão (Aluno)**
```javascript
socket.emit('student:join', {
  sessionId: 'uuid',
  studentId: 'uuid'
});
```

**3. Enviar Dados EEG (Aluno)**
```javascript
socket.emit('eeg:data', {
  sessionId: 'uuid',
  studentId: 'uuid',
  timestamp: '2025-01-20T10:10:00.000Z',
  attention: 85,
  relaxation: 72,
  delta: 123456,
  theta: 234567,
  lowAlpha: 345678,
  highAlpha: 456789,
  lowBeta: 567890,
  highBeta: 678901,
  lowGamma: 789012,
  middleGamma: 890123
});
```

**4. Sair da Sessão**
```javascript
socket.emit('leave', {
  sessionId: 'uuid'
});
```

#### Servidor → Cliente

**1. Atualização de Dados EEG**
```javascript
socket.on('eeg:update', (data) => {
  // data = {
  //   studentId: 'uuid',
  //   studentName: 'João Silva',
  //   timestamp: '2025-01-20T10:10:00.000Z',
  //   attention: 85,
  //   relaxation: 72,
  //   delta: 123456,
  //   ...
  // }
});
```

**2. Aluno Conectou**
```javascript
socket.on('student:connected', (data) => {
  // data = {
  //   studentId: 'uuid',
  //   studentName: 'João Silva',
  //   connectedAt: '2025-01-20T10:06:00.000Z'
  // }
});
```

**3. Aluno Desconectou**
```javascript
socket.on('student:disconnected', (data) => {
  // data = {
  //   studentId: 'uuid',
  //   studentName: 'João Silva'
  // }
});
```

**4. Métricas da Sessão**
```javascript
socket.on('session:metrics', (data) => {
  // data = {
  //   avgAttention: 82,
  //   avgRelaxation: 68,
  //   connectedStudents: 23,
  //   totalDataPoints: 1245
  // }
});
```

**5. Erros**
```javascript
socket.on('error', (error) => {
  // error = {
  //   message: 'Session not found',
  //   code: 'SESSION_NOT_FOUND'
  // }
});
```

---

## Códigos de Status

### HTTP Status Codes

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Requisição bem-sucedida sem conteúdo
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: email já existe)
- `422 Unprocessable Entity` - Validação falhou
- `500 Internal Server Error` - Erro no servidor

### Formato de Erro

```json
{
  "error": {
    "message": "Email já cadastrado",
    "code": "EMAIL_ALREADY_EXISTS",
    "details": {
      "field": "email",
      "value": "usuario@escola.com"
    }
  }
}
```

### Códigos de Erro Customizados

- `EMAIL_ALREADY_EXISTS` - Email já cadastrado
- `INVALID_CREDENTIALS` - Credenciais inválidas
- `SESSION_NOT_FOUND` - Sessão não encontrada
- `UNAUTHORIZED_ROLE` - Papel sem permissão
- `CLASS_NOT_FOUND` - Turma não encontrada
- `STUDENT_NOT_IN_CLASS` - Aluno não está na turma
- `SESSION_ALREADY_ACTIVE` - Sessão já está ativa
- `SESSION_ALREADY_ENDED` - Sessão já foi encerrada
- `TOKEN_EXPIRED` - Token expirado
- `REFRESH_TOKEN_INVALID` - Refresh token inválido

---

## Exemplo de Fluxo Completo

### Fluxo: Professor Inicia Sessão

```javascript
// 1. Professor faz login
POST /api/v1/auth/login
{
  "email": "professor@escola.com",
  "password": "Senha123!"
}
// → Recebe accessToken

// 2. Professor cria sessão
POST /api/v1/sessions
Authorization: Bearer <accessToken>
{
  "title": "Matemática - Equações",
  "class_id": "uuid",
  "session_type": "monitoramento",
  "scheduled_at": "2025-01-20T10:00:00Z"
}
// → Recebe sessionId

// 3. Professor inicia sessão
POST /api/v1/sessions/:sessionId/start
// → Recebe websocket_url

// 4. Professor conecta ao WebSocket
const socket = io('ws://localhost:3001', {
  auth: { token: accessToken }
});

socket.emit('teacher:join', { sessionId });

// 5. Aluno conecta ao WebSocket
socket.emit('student:join', {
  sessionId,
  studentId: 'uuid'
});

// 6. Aluno envia dados EEG
socket.emit('eeg:data', {
  sessionId,
  studentId,
  timestamp: new Date().toISOString(),
  attention: 85,
  relaxation: 72,
  ...
});

// 7. Professor recebe updates em tempo real
socket.on('eeg:update', (data) => {
  console.log(`${data.studentName}: Atenção ${data.attention}`);
});

// 8. Professor encerra sessão
POST /api/v1/sessions/:sessionId/end
// → Recebe métricas finais

// 9. Professor visualiza relatório
GET /api/v1/sessions/:sessionId/report
// → Recebe relatório completo
```

---

## Notas Importantes

1. **Rate Limiting:** 100 requisições por minuto por IP
2. **Tamanho Máximo:** Payloads limitados a 10MB
3. **Timeout:** Requisições timeout após 30 segundos
4. **WebSocket Heartbeat:** Ping a cada 25 segundos, desconecta após 30s sem resposta
5. **Dados EEG:** Salvar em batch (máximo 100 pontos por requisição)
6. **CSV Backup:** Servidor Python salva CSV automático como backup

---

**Documento:** 05-API-ENDPOINTS.md
**Versão:** 1.0
**Data:** 07/11/2025
**Autor:** Claude Code (NeuroOne Team)
