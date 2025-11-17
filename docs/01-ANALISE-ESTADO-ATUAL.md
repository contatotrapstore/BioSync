# 📊 Análise do Estado Atual - BioSync Game

> **⚠️ DOCUMENTO HISTÓRICO**
> Esta análise foi realizada em 07/11/2025 como ponto de partida para a transformação em NeuroOne.
> O projeto evoluiu significativamente desde então. Consulte [PROJETO-COMPLETO-FINAL.md](../PROJETO-COMPLETO-FINAL.md) para estado atual.

**Data:** 2025-11-07
**Versão:** 1.0 (Histórico)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Módulo: biosync-admin](#módulo-biosync-admin)
- [Módulo: biosync-backend](#módulo-biosync-backend)
- [Módulo: biosync-launcher](#módulo-biosync-launcher)
- [Módulo: neuroone-mobile](#módulo-neuroone-mobile)
- [Banco de Dados Atual](#banco-de-dados-atual)
- [Infraestrutura Atual](#infraestrutura-atual)
- [O que Manter](#o-que-manter)
- [O que Descartar/Modificar](#o-que-descartarmodificar)
- [Gaps Identificados](#gaps-identificados)

---

## Visão Geral

O projeto atual é uma plataforma de **jogos cognitivos** com sistema de assinaturas e pagamentos. Possui 4 módulos em produção:

1. **biosync-admin** - Painel administrativo web
2. **biosync-backend** - API REST + Autenticação
3. **biosync-launcher** - Launcher desktop (Electron)
4. **neuroone-mobile** - App mobile Android (Capacitor)

**Total estimado:** ~50.000 linhas de código

---

## Estrutura do Projeto

```
BioSync Game FN/
├── biosync-admin/          # React 18 + Material-UI
│   ├── src/
│   │   ├── components/     (12 componentes)
│   │   ├── pages/          (8 páginas)
│   │   ├── services/       (API client)
│   │   └── contexts/       (AuthContext)
│   └── package.json
│
├── biosync-backend/        # Node.js 18 + Express
│   ├── src/
│   │   ├── controllers/    (7 controllers)
│   │   ├── routes/         (11 rotas)
│   │   ├── middleware/     (Auth, rate limit)
│   │   └── services/       (Business logic)
│   └── package.json
│
├── biosync-launcher/       # Electron 29 + React
│   ├── src/
│   │   ├── components/     (5 componentes)
│   │   ├── pages/          (5 páginas)
│   │   └── services/       (API client)
│   ├── main.js             (Electron main)
│   └── package.json
│
├── neuroone-mobile/        # Capacitor 7 + React + TypeScript
│   ├── src/
│   │   ├── components/     (5 componentes)
│   │   ├── pages/          (6 páginas)
│   │   ├── services/       (API, Bluetooth)
│   │   └── capacitor/      (Integrações nativas)
│   ├── android/            (Projeto Android)
│   └── package.json
│
├── Jogos/                  # 13 jogos HTML5
├── docs/                   # Documentação
└── ref em index/           # Protótipos UI/UX
```

---

## Módulo: biosync-admin

### Tecnologias

```json
{
  "react": "^18.2.0",
  "@mui/material": "^5.14.0",
  "react-router-dom": "^6.14.0",
  "axios": "^1.4.0",
  "recharts": "^2.7.0",
  "vite": "^4.4.0"
}
```

### Componentes Existentes

| Componente | Função | Status |
|------------|--------|--------|
| GameCard.jsx | Card de jogo | ✅ Manter estrutura |
| GameForm.jsx | Formulário de jogo | ❌ Descartar |
| Header.jsx | Cabeçalho | ✅ Adaptar |
| Layout.jsx | Layout principal | ✅ Adaptar |
| PatientCard.jsx | Card de paciente | ❌ Descartar |
| PlanCard.jsx | Card de plano | ❌ Descartar |
| PlanForm.jsx | Formulário de plano | ❌ Descartar |
| ScoreChart.jsx | Gráfico de pontuação | ✅ Adaptar para EEG |
| ScoreHistory.jsx | Histórico | ✅ Adaptar |
| Sidebar.jsx | Barra lateral | ✅ Adaptar para roles |
| UserForm.jsx | Formulário de usuário | ✅ Manter e adaptar |
| UserTable.jsx | Tabela de usuários | ✅ Manter e adaptar |

### Páginas Existentes

| Página | Função | Status |
|--------|--------|--------|
| Dashboard.jsx | Dashboard admin | ✅ Refatorar para Direção |
| Games.jsx | Gestão de jogos | ❌ Descartar |
| Login.jsx | Tela de login | ✅ Adaptar design |
| PatientDetail.jsx | Detalhes paciente | ❌ Descartar |
| PsychologistDashboard.jsx | Dashboard psicólogo | ❌ Descartar |
| Requests.jsx | Solicitações | ❌ Descartar |
| Subscriptions.jsx | Assinaturas | ❌ Descartar |
| Users.jsx | Gestão usuários | ✅ Adaptar |

### Services

```javascript
// services/api.js
- axios client configurado
- Interceptors JWT
- Refresh token automático
- Base URL: https://neurogame-7av9.onrender.com/api/v1

STATUS: ✅ MANTER (mudar endpoints)
```

### Contextos

```javascript
// contexts/AuthContext.jsx
- Login/Logout
- User state
- Token management

STATUS: ✅ MANTER (adicionar user_role)
```

---

## Módulo: biosync-backend

### Tecnologias

```json
{
  "node": "18.x",
  "express": "^4.18.2",
  "@supabase/supabase-js": "^2.38.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.10.0"
}
```

### Controllers Atuais

| Controller | Função | Status |
|------------|--------|--------|
| authController.js | Login, JWT, refresh | ✅ MANTER |
| gameController.js | CRUD jogos | ❌ DESCARTAR |
| psychologistController.js | Psicólogo-paciente | ❌ DESCARTAR |
| scoresController.js | Pontuações | ⚠️ ADAPTAR para métricas EEG |
| subscriptionController.js | Assinaturas/pagamentos | ❌ DESCARTAR |
| userController.js | CRUD usuários | ✅ MANTER e adaptar |
| webhookController.js | Webhooks Asaas | ❌ DESCARTAR |

### Routes Atuais

```
/api/v1/auth/         ✅ MANTER
  - POST /login
  - POST /refresh-token
  - GET /profile

/api/v1/users/        ✅ MANTER E ADAPTAR
  - GET /
  - POST /
  - GET /:id
  - PUT /:id
  - DELETE /:id

/api/v1/games/        ❌ DESCARTAR
/api/v1/subscriptions/ ❌ DESCARTAR
/api/v1/psychologists/ ❌ DESCARTAR
/api/v1/payments/     ❌ DESCARTAR
```

### Middleware

```javascript
// middleware/auth.js
- verifyToken
- JWT validation

STATUS: ✅ MANTER

// middleware/rateLimit.js
- Rate limiting (100 req/15min)

STATUS: ✅ MANTER E AJUSTAR

// middleware/errorHandler.js
- Error handling

STATUS: ✅ MANTER
```

---

## Módulo: biosync-launcher

### Tecnologias

```json
{
  "electron": "^29.0.0",
  "react": "^18.2.0",
  "@mui/material": "^5.14.0"
}
```

### Função Atual

- Launcher de jogos para PC
- Download e instalação de jogos
- Sistema de proteção de conteúdo
- Auto-update

### Status

⚠️ **REESTRUTURAR ou MIGRAR PARA PWA**

**Opções:**
1. Manter Electron e adaptar para professor/aluno
2. Migrar para PWA (Progressive Web App)

**Recomendação:** PWA é mais simples e multiplataforma

---

## Módulo: neuroone-mobile

### Tecnologias

```json
{
  "react": "^18.2.0",
  "@capacitor/core": "^7.0.0",
  "@capacitor/android": "^7.0.0",
  "typescript": "^5.0.0"
}
```

### Estrutura Atual

✅ **BOM**: Já usa TypeScript e Capacitor

### Tema Atual

```typescript
// theme.ts
const theme = {
  primary: '#FFD913',      // Dourado
  secondary: '#66E6B9',    // Verde-água
  background: '#05070F',   // Preto azulado
  text: '#F8F9FF'
};
```

**Status:** ⚠️ **Adaptar para novo design system**

### Função Atual

- Login de usuários
- Biblioteca de jogos mobile
- Download e execução de jogos
- Sistema de pontuação

### Status

⚠️ **REESTRUTURAR COMPLETAMENTE**

Precisa adicionar:
- Conexão Bluetooth com EEG
- Processamento de sinais (FFT)
- Transmissão WebSocket
- Dashboard de métricas

---

## Banco de Dados Atual

### Supabase PostgreSQL 17

**Projeto:** BioSync (id: uszmhhukjohjarplnlmp)
**Region:** sa-east-1 (São Paulo)
**Status:** ACTIVE_HEALTHY

### Tabelas Existentes

```sql
1. users
   - id (UUID)
   - email
   - password_hash
   - name
   - username
   - role (admin, user, psychologist)
   - created_at

2. launcher_sessions
   - id (UUID)
   - user_id
   - session_token
   - expires_at

3. games
   - id (UUID)
   - title
   - description
   - category
   - platform (pc, mobile, both)
   - file_path
   - thumbnail
   - version

4. user_game_access
   - id (UUID)
   - user_id
   - game_id
   - access_granted

5. game_requests
   - id (UUID)
   - user_id
   - game_id
   - status

6. subscription_plans
   - id (UUID)
   - name
   - price
   - duration_days

7. plan_games
   - plan_id
   - game_id

8. subscriptions
   - id (UUID)
   - user_id
   - plan_id
   - start_date
   - end_date
   - status

9. payments
   - id (UUID)
   - user_id
   - amount
   - status
   - asaas_id

10. psychologist_patients
    - id (UUID)
    - psychologist_id
    - patient_id

11. game_scores
    - id (UUID)
    - user_id
    - game_id
    - score
    - created_at
```

### O que Manter

✅ **users** - Adaptar (adicionar `user_role`)
✅ **launcher_sessions** - Manter

### O que Descartar

❌ **games** - Não relevante para neurofeedback
❌ **user_game_access** - Não necessário
❌ **game_requests** - Não necessário
❌ **subscription_plans** - Não necessário
❌ **plan_games** - Não necessário
❌ **subscriptions** - Não necessário
❌ **payments** - Não necessário
❌ **psychologist_patients** - Não necessário

### O que Adaptar

⚠️ **game_scores** → **eeg_data** (completamente diferente)

---

## Infraestrutura Atual

### Deploy

```
Frontend (biosync-admin):   Vercel
Backend (biosync-backend):  Render.com
Database:                   Supabase (sa-east-1)
Domain:                     neurogame-7av9.onrender.com
```

**Status:** ✅ **MANTER infraestrutura**

### CI/CD

GitHub Actions (básico)

**Status:** ✅ **MANTER e melhorar**

### Monitoring

Não implementado

**Status:** ⚠️ **ADICIONAR**

---

## O que Manter

### ✅ Infraestrutura

- Supabase PostgreSQL
- JWT authentication
- Vercel (frontend)
- Render (backend)
- GitHub Actions

### ✅ Código Base

- Structure de pastas
- API client (axios + interceptors)
- AuthContext
- Error handling
- Rate limiting
- Material-UI como biblioteca

### ✅ Componentes Genéricos

- Layout.jsx
- Header.jsx
- Sidebar.jsx (adaptar)
- UserForm.jsx
- UserTable.jsx
- ScoreChart.jsx (adaptar)

---

## O que Descartar/Modificar

### ❌ Completamente Descartar

- Sistema de jogos
- Sistema de assinaturas
- Sistema de pagamentos
- Psicólogo-paciente
- Launcher de jogos
- Download de conteúdo

### ⚠️ Modificar/Refatorar

- Dashboard → Direção, Professor, Aluno
- User management → Adicionar roles (direção, professor, aluno)
- Score system → EEG metrics system
- Mobile app → Adicionar Bluetooth + FFT
- Theme → Novo design system (light/dark)

---

## Gaps Identificados

### 🔴 Crítico (Não Existe)

1. **WebSocket para tempo real** - Não implementado
2. **Conexão Bluetooth** - Não implementado
3. **Processamento de sinais EEG** - Não implementado
4. **Sistema de sessões de aula** - Não implementado
5. **Tabelas de EEG no banco** - Não existem
6. **Sistema de turmas** - Não implementado
7. **Roles específicos** - Parcialmente (falta granularidade)
8. **Gráficos de análise EEG** - Não existem

### 🟡 Importante (Precisa Melhorar)

9. **Design system** - Incompleto (falta dark mode)
10. **Temas** - Apenas light mode
11. **Relatórios** - Básicos, precisam ser expandidos
12. **Exportação** - Não implementado
13. **Monitoring** - Não implementado
14. **Testes** - Cobertura baixa

---

## Métricas do Código Atual

```
Linguagens:
- JavaScript:  85%
- TypeScript:  10%
- HTML/CSS:    5%

Linhas de código:
- biosync-admin:    ~8,000 linhas
- biosync-backend:  ~12,000 linhas
- biosync-launcher: ~6,000 linhas
- neuroone-mobile:  ~7,000 linhas

Componentes React:  ~30 componentes
Endpoints API:      ~40 endpoints
Tabelas DB:         15 tabelas
```

---

## Próximos Passos

1. ✅ Criar novo schema de banco de dados
2. ✅ Implementar sistema de roles
3. ✅ Refatorar frontend para 3 personas
4. ✅ Adicionar WebSocket
5. ✅ Implementar Bluetooth no mobile
6. ✅ Adicionar processamento EEG
7. ✅ Criar dashboards específicos
8. ✅ Implementar relatórios

---

## Documentos Relacionados

- [04-DATABASE-SCHEMA.md](./04-DATABASE-SCHEMA.md) - Novo schema do banco
- [03-ARQUITETURA.md](./03-ARQUITETURA.md) - Nova arquitetura
- [07-FASE-1-FUNDACAO.md](./07-FASE-1-FUNDACAO.md) - Primeira fase

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
