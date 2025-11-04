# 🏗️ Arquitetura do Sistema NeuroOne

Documentação completa da arquitetura técnica da plataforma NeuroOne.

---

## 📋 Visão Geral

A plataforma NeuroOne é um sistema distribuído composto por 4 componentes principais que se comunicam via API REST:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEUROONE PLATFORM                             │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐             │
│  │   BACKEND    │◄──►│  ADMIN PANEL │    │ LAUNCHER  │             │
│  │              │    │              │    │    PC     │             │
│  │  Node.js API │    │  React App   │    │ Electron  │             │
│  │ (Render.com) │    │  (Vercel)    │    │ (Desktop) │             │
│  └──────┬───────┘    └──────────────┘    └─────┬─────┘             │
│         │                                       │                    │
│         │                                       │                    │
│         ▼                                       │                    │
│  ┌──────────────┐                              │                    │
│  │   SUPABASE   │                              │                    │
│  │  PostgreSQL  │◄─────────────────────────────┘                    │
│  │  (Database)  │                                                    │
│  └──────────────┘                                                    │
│         ▲                                                             │
│         │                                                             │
│         │                  ┌───────────┐                            │
│         └──────────────────┤   MOBILE  │                            │
│                            │    APP    │                            │
│                            │ Capacitor │                            │
│                            │ (Android) │                            │
│                            └───────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes

### 1. Backend API (biosync-backend/)

**Tecnologias:**
- Node.js 18+
- Express.js
- Supabase Client
- JWT (jsonwebtoken)
- Axios (pagamentos Asaas)

**Estrutura de Pastas:**
```
biosync-backend/
├── src/
│   ├── config/          # Configurações (Supabase, JWT, Asaas)
│   ├── controllers/     # Lógica de negócio
│   ├── middleware/      # Auth, validação, error handling
│   ├── routes/          # Definição de rotas da API
│   ├── services/        # Serviços externos (Asaas, storage)
│   └── server.js        # Entry point
├── package.json
└── .env
```

**Principais Responsabilidades:**
- Autenticação e autorização JWT
- CRUD de usuários, jogos, assinaturas
- Integração com sistema de pagamentos (Asaas)
- Webhooks (Asaas notifications)
- Gestão de plataformas (PC/Mobile filtering)
- Gestão de psicólogos e pontuações
- RLS (Row Level Security) via Supabase

**Deploy:**
- Plataforma: Render.com
- URL: `https://neurogame-7av9.onrender.com`
- CI/CD: Auto-deploy via GitHub push

---

### 2. Admin Panel (biosync-admin/)

**Tecnologias:**
- React 18
- Material-UI v5
- React Router DOM v6
- Axios
- Recharts (gráficos)
- Vite (build tool)

**Estrutura de Pastas:**
```
biosync-admin/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── pages/           # Páginas (Dashboard, Jogos, Usuários, etc.)
│   ├── services/        # API client
│   ├── contexts/        # React Contexts (Auth)
│   ├── hooks/           # Custom hooks
│   └── App.jsx
├── public/
└── package.json
```

**Principais Responsabilidades:**
- Interface de administração
- CRUD de jogos (com upload de arquivos)
- **Seleção de plataformas** (PC/Mobile) por jogo
- Gestão de usuários e assinaturas
- Dashboard de psicólogos
- Visualização de pontuações (Recharts)
- Análise de solicitações de acesso

**Deploy:**
- Plataforma: Vercel
- URL: `https://biosync-admin.vercel.app`
- CI/CD: Auto-deploy via GitHub integration

---

### 3. Launcher PC (biosync-launcher/)

**Tecnologias:**
- Electron 29
- React 18
- Material-UI v5
- Axios
- Electron Builder (empacotamento)

**Estrutura de Pastas:**
```
biosync-launcher/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   └── main.js          # Electron main process
├── Jogos/               # Jogos locais (13 jogos)
├── public/
└── package.json
```

**Principais Responsabilidades:**
- Biblioteca de jogos (filtrada por `platform=pc`)
- Autenticação JWT
- Validação de assinaturas
- Download e instalação de jogos
- Proteção de conteúdo (session tokens)
- Sistema de atualizações automáticas
- Execução de jogos em WebView

**Distribuição:**
- Formato: Instalador NSIS (.exe)
- Plataformas: Windows, Linux
- Tamanho: ~90MB
- Versão atual: 2.2.0

---

### 4. Mobile App (neuroone-mobile/)

**Tecnologias:**
- React 18
- TypeScript
- Capacitor 7
- Material-UI v5
- Axios
- Android SDK

**Estrutura de Pastas:**
```
neuroone-mobile/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── contexts/
│   ├── types/
│   ├── capacitor/       # Integrações nativas
│   └── App.tsx
├── android/             # Projeto Android nativo
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── res/
│   └── build.gradle
└── package.json
```

**Principais Responsabilidades:**
- Biblioteca de jogos (filtrada por `platform=mobile`)
- Autenticação JWT
- Download e execução local de jogos
- Sistema de pontuação e progresso
- Interface Material-UI responsiva
- Modo offline após download

**Distribuição:**
- Formato: APK
- Plataforma: Android 7.0+ (API Level 24+)
- Tamanho: ~3.5MB
- Versão atual: 2.3.0

---

## 🗄️ Banco de Dados (Supabase PostgreSQL)

### Esquema de Tabelas

#### Autenticação e Usuários
```sql
users (
  id UUID PRIMARY KEY,
  username VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  password VARCHAR (hashed),
  full_name VARCHAR,
  is_active BOOLEAN,
  is_psychologist BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

launcher_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_id VARCHAR,
  expires_at TIMESTAMP
)
```

#### Jogos e Plataformas
```sql
games (
  id UUID PRIMARY KEY,
  name VARCHAR,
  slug VARCHAR UNIQUE,
  description TEXT,
  category VARCHAR,
  cover_image VARCHAR,
  folder_path VARCHAR,
  is_active BOOLEAN,
  order INTEGER,
  version VARCHAR,
  download_url TEXT,
  file_size BIGINT,
  checksum VARCHAR,
  supported_platforms VARCHAR(50)[] DEFAULT ARRAY['pc', 'mobile'], -- NOVO v2.3.0
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Índice GIN para performance em queries de array
CREATE INDEX idx_games_platforms ON games USING GIN (supported_platforms);
```

#### Assinaturas e Pagamentos
```sql
subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR,
  price DECIMAL,
  billing_type VARCHAR, -- 'monthly', 'yearly'
  is_active BOOLEAN
)

user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR, -- 'active', 'suspended', 'cancelled'
  next_due_date DATE,
  created_at TIMESTAMP
)

payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  asaas_payment_id VARCHAR,
  amount DECIMAL,
  status VARCHAR, -- 'pending', 'confirmed', 'failed'
  payment_method VARCHAR, -- 'pix', 'credit_card'
  paid_at TIMESTAMP
)
```

#### Psicólogos e Pontuações
```sql
psychologist_patients (
  id UUID PRIMARY KEY,
  psychologist_id UUID REFERENCES users(id),
  patient_id UUID REFERENCES users(id),
  created_at TIMESTAMP
)

game_scores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  game_id UUID REFERENCES games(id),
  score INTEGER,
  duration_seconds INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### Row Level Security (RLS)

**Políticas Implementadas:**
- Users podem ler apenas seus próprios dados
- Psicólogos podem ver dados de seus pacientes
- Admins têm acesso total
- Service role bypassa todas as políticas

---

## 🔐 Segurança

### Autenticação e Autorização

**JWT (JSON Web Tokens):**
```javascript
// Access Token
{
  "userId": "uuid",
  "username": "string",
  "isPsychologist": boolean,
  "exp": timestamp,  // 15 minutos
  "iat": timestamp
}

// Refresh Token
{
  "userId": "uuid",
  "exp": timestamp,  // 7 dias
  "iat": timestamp
}
```

**Fluxo de Autenticação:**
1. Cliente envia `username` e `password`
2. Backend valida credenciais com Supabase
3. Backend gera Access Token (15min) e Refresh Token (7d)
4. Cliente armazena tokens (localStorage/Preferences)
5. Cliente inclui Access Token em todas as requisições: `Authorization: Bearer {token}`
6. Quando Access Token expira, cliente usa Refresh Token para obter novo Access Token

**Endpoints Protegidos:**
- Middleware `authenticateToken` valida JWT
- Middleware `checkSubscription` valida assinatura ativa
- Middleware `requirePsychologist` valida role de psicólogo

### CORS

**Origens Permitidas:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',           // Admin local
  'https://biosync-admin.vercel.app', // Admin prod
  'https://admin.biosync.com.br'     // Admin custom domain
];
```

### Rate Limiting

**Configuração:**
- **Geral**: 100 req/15min por IP
- **Login**: 5 req/15min por IP
- **Webhooks**: Sem limite (validação via signature)

---

## 🎮 Sistema de Distribuição Multiplataforma

### Conceito

Cada jogo pode suportar uma ou mais plataformas: **PC**, **Mobile**, ou ambas.

### Como Funciona

#### 1. Admin Panel
Ao criar/editar um jogo, o admin seleciona:
- ☑️ PC (Windows/Linux)
- ☑️ Mobile (Android)

Isso armazena um array no banco:
```sql
supported_platforms = ARRAY['pc', 'mobile']  -- Ambas
supported_platforms = ARRAY['pc']            -- Apenas PC
supported_platforms = ARRAY['mobile']        -- Apenas Mobile
```

#### 2. Backend Filtering
Launchers fazem requests com parâmetro `platform`:

```http
GET /api/v1/games/user/games?platform=pc
GET /api/v1/games/user/games?platform=mobile
```

Backend filtra usando query SQL:
```sql
SELECT * FROM games
WHERE is_active = true
  AND supported_platforms @> ARRAY['pc']::VARCHAR[];
```

**Performance:** Índice GIN permite O(log n) em vez de O(n)

#### 3. Launchers
- **PC Launcher**: Sempre usa `?platform=pc`
- **Mobile App**: Sempre usa `?platform=mobile`
- Cada um exibe apenas jogos compatíveis

### Casos de Uso

| Tipo de Jogo | Plataformas | Exemplo |
|--------------|-------------|---------|
| Mouse/Keyboard heavy | PC apenas | Jogos de estratégia complexa |
| Touch-friendly | PC + Mobile | Jogos casuais, puzzles |
| Mobile-first | Mobile apenas | Jogos otimizados para touch |

---

## 🔄 Fluxo de Dados

### 1. Autenticação de Usuário

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│ Launcher│─────>│ Backend │─────>│ Supabase │
│  /Login │ POST │  Auth   │ Query│   users  │
└─────────┘      └─────────┘      └──────────┘
     │                  │                │
     │<─────────────────┘                │
     │   JWT Tokens                      │
     │                                   │
     └───────────────────────────────────┘
          Armazena tokens localmente
```

### 2. Listagem de Jogos

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│ Launcher│─────>│ Backend │─────>│ Supabase │
│  /Games │ GET  │  Games  │ Query│   games  │
│?platform=pc    └─────────┘      └──────────┘
└─────────┘           │
     ▲                │ Filtra por platform
     │<───────────────┘
     │   Lista de jogos PC
```

### 3. Validação de Assinatura

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│ Launcher│─────>│ Backend │─────>│ Supabase │
│Play Game│ GET  │Validate │ Query│user_subs │
└─────────┘      └─────────┘      └──────────┘
     │                  │
     │<─────────────────┘
     │   Session Token (15min)
     │
     └──> Abre jogo com token na URL
```

### 4. Webhook de Pagamento

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│  Asaas  │─────>│ Backend │─────>│ Supabase │
│ Webhook │ POST │Webhooks │Update│ payments │
└─────────┘      └─────────┘      └──────────┘
                      │
                      └──> Atualiza status assinatura
```

---

## 📊 Tecnologias por Camada

### Frontend (Admin + Launcher + Mobile)
- **Framework**: React 18
- **UI Library**: Material-UI v5
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Build**: Vite

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database Client**: Supabase Client
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Payment**: Axios (Asaas API)

### Database
- **Provider**: Supabase
- **Engine**: PostgreSQL 15
- **ORM**: Supabase Client (não usa ORM tradicional)
- **Security**: Row Level Security (RLS)

### Desktop (Launcher PC)
- **Platform**: Electron 29
- **Packaging**: electron-builder
- **Auto-update**: electron-updater
- **Format**: NSIS installer (.exe)

### Mobile
- **Framework**: Capacitor 7
- **Platform**: Android SDK 24+
- **Language**: TypeScript
- **Build Tool**: Gradle

---

## 🚀 Deploy e Infraestrutura

### Ambientes

| Componente | Ambiente Dev | Ambiente Prod |
|------------|--------------|---------------|
| Backend | localhost:3000 | Render.com |
| Admin | localhost:5173 | Vercel |
| Launcher PC | Electron local | Instalador .exe |
| Mobile App | Android Studio | APK |
| Database | Supabase | Supabase |

### CI/CD

**Backend (Render):**
- Trigger: Push para branch `master`
- Build: `npm install`
- Start: `npm start`
- Variáveis: `.env` configurado no dashboard

**Admin (Vercel):**
- Trigger: Push para branch `master`
- Build: `npm run build`
- Output: `dist/`
- Variáveis: `VITE_API_URL` configurado no dashboard

**Launcher PC:**
- Build manual: `npm run build:win`
- Output: `dist-electron/NeuroOne Launcher-Setup-{version}.exe`
- Distribuição: Download direto ou via API `/downloads`

**Mobile App:**
- Build manual: `./gradlew assembleRelease`
- Output: `app-release-unsigned.apk`
- Distribuição: Download direto ou Google Play Store (futuro)

---

## 📈 Escalabilidade

### Limites Atuais

| Recurso | Limite Free Tier | Solução para Escalar |
|---------|------------------|----------------------|
| Supabase DB | 500MB | Upgrade para Pro ($25/mês) |
| Render Backend | 512MB RAM | Upgrade para Standard ($7/mês) |
| Vercel Admin | 100GB bandwidth | Upgrade para Pro ($20/mês) |

### Melhorias Futuras

1. **Cache Redis** para sessões e queries frequentes
2. **CDN** para assets estáticos e instaladores
3. **Load Balancer** para múltiplas instâncias do backend
4. **Database Replication** para reads distribuídos
5. **Microserviços** separar auth, payments, games em serviços independentes

---

## 🔍 Monitoramento

### Logs

**Backend (Render):**
- Logs em tempo real via dashboard Render
- Logs de erro salvos em Supabase (`error_logs` table - futuro)

**Admin (Vercel):**
- Logs de build e runtime via dashboard Vercel
- Analytics via Vercel Analytics

**Database (Supabase):**
- Query performance via Supabase dashboard
- Table statistics e indexes usage

### Métricas

**Key Performance Indicators:**
- Tempo de resposta API (target: <500ms)
- Taxa de erro (target: <1%)
- Uptime (target: >99.9%)
- Tempo de login (target: <2s)
- Tempo de listagem de jogos (target: <1s)

---

## 📚 Referências

- **Backend API**: [biosync-backend/README.md](../biosync-backend/README.md)
- **Admin Panel**: [biosync-admin/README.md](../biosync-admin/README.md)
- **Launcher PC**: [biosync-launcher/README.md](../biosync-launcher/README.md)
- **Mobile App**: [neuroone-mobile/README.md](../neuroone-mobile/README.md)
- **Deploy Guide**: [deploy/GUIA_DEPLOY_PRODUCAO.md](deploy/GUIA_DEPLOY_PRODUCAO.md)

---

**Última atualização**: 2025-11-04
**Versão da arquitetura**: 2.3.0
**Plataforma**: NeuroOne
