# Quick Start - Sistema NeuroOne

Guia rápido para executar o sistema NeuroOne completo.

---

## 📋 Pré-requisitos

- **Node.js** 18+ instalado
- **npm** ou **yarn**
- **Supabase** configurado com o schema do banco de dados
- **Git** (opcional)

---

## 🚀 Instalação e Configuração

### 1. Backend WebSocket Server

```bash
# Navegar para pasta do backend
cd neuroone-backend

# Instalar dependências (se ainda não instalou)
npm install

# Configurar variáveis de ambiente
# Edite o arquivo .env com suas credenciais Supabase
nano .env
```

**Configurar DATABASE_URL no .env**:
```env
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@[SEU-PROJETO].supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### 2. Frontend React

```bash
# Navegar para pasta do frontend
cd neuroone-frontend

# Instalar dependências (se ainda não instalou)
npm install

# Configurar variáveis de ambiente
# Já criado: .env.local
```

O arquivo `.env.local` já está configurado:
```env
VITE_WS_URL=http://localhost:3001
```

---

## ▶️ Executar o Sistema

Você precisa de **2 terminais** abertos:

### Terminal 1: Backend

```bash
cd neuroone-backend
npm run dev
```

**Output esperado**:
```
🚀 NeuroOne WebSocket Server running on port 3001
📡 WebSocket endpoint: ws://localhost:3001
🌐 HTTP endpoint: http://localhost:3001
✅ CORS allowed origins: http://localhost:5173
✅ Database connection established
```

### Terminal 2: Frontend

```bash
cd neuroone-frontend
npm run dev
```

**Output esperado**:
```
VITE v7.2.2  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🔐 Login no Sistema

Acesse: **http://localhost:5173**

### Usuários de Teste

#### Direção
- **Email**: `direcao@neuroone.com`
- **Senha**: `Direcao123!`
- **Acesso**: Dashboard administrativo completo

#### Professor
- **Email**: `professor@neuroone.com`
- **Senha**: `Professor123!`
- **Acesso**: Dashboard do professor, criação de sessões, monitoramento

#### Aluno
- **Email**: `aluno@neuroone.com`
- **Senha**: `Aluno123!`
- **Acesso**: PWA do aluno (ainda não implementado)

---

## 📊 Fluxo de Uso

### Como Professor

1. **Login** com credenciais de professor
2. **Dashboard** `/teacher` - Visualizar turmas e sessões
3. **Criar Sessão** - Clicar "Nova Sessão"
   - Selecionar turma
   - Selecionar jogo
   - Configurar thresholds
4. **Iniciar Sessão** - Clicar "Iniciar" na sessão criada
5. **Monitoramento em Tempo Real** `/teacher/session/:id/active`
   - Ver alunos conectados (dados mockados por enquanto)
   - Ver métricas em tempo real
6. **Finalizar Sessão** - Clicar "Finalizar Sessão"
7. **Relatório** `/teacher/session/:id/report`
   - Visualizar métricas consolidadas
   - Gráficos de evolução
   - Ranking de alunos

### Como Direção

1. **Login** com credenciais de direção
2. **Dashboard** `/admin` - Visão geral do sistema
3. **Usuários** `/admin/users` - Gerenciar professores e alunos
4. **Turmas** `/admin/classes` - Criar e editar turmas
5. **Sessões** `/admin/sessions` - Visualizar todas as sessões
6. **Configurações** `/admin/settings` - Ajustes do sistema

---

## 🧪 Testar WebSocket Server

### Opção 1: Cliente de Teste Simulado

```bash
# Terminal 3 (com backend rodando)
cd neuroone-backend
node test-client.js
```

Este script simula:
- 3 alunos enviando dados EEG a 4Hz
- 1 professor monitorando em tempo real

**Output**:
```
✅ [Ana Silva] Connected
🎓 [Ana Silva] Joined session: test-session-id
👨‍🏫 [Teacher] Connected
📊 [Teacher] EEG from Ana Silva: Attention=75% Relaxation=65%
```

### Opção 2: Health Check

```bash
curl http://localhost:3001/health
```

**Resposta**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "uptime": 123.456
}
```

### Opção 3: Frontend Real

Com backend e frontend rodando:
1. Login como professor
2. Criar e iniciar uma sessão
3. Verificar console do backend - deve mostrar:
   ```
   👨‍🏫 Teacher abc123 joined session def456
   ```
4. No frontend, a interface SessionActive deve mostrar:
   - Chip "Conectado" (verde) no header
   - Lista de alunos da turma

---

## 📁 Estrutura do Projeto

```
BioSync Game FN/
├── neuroone-backend/           # Backend WebSocket
│   ├── src/
│   │   ├── handlers/           # Event handlers
│   │   ├── services/           # Database queries
│   │   ├── utils/              # Logger, simulators
│   │   └── server.js           # Entry point
│   ├── test-client.js          # Cliente de teste
│   ├── .env                    # Configuração (NÃO commitar)
│   └── package.json
│
├── neuroone-frontend/          # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/              # Páginas (admin, teacher, student)
│   │   ├── hooks/              # useWebSocketEEG, etc.
│   │   ├── contexts/           # Auth, Theme
│   │   └── App.jsx
│   ├── .env.local              # Configuração frontend
│   └── package.json
│
└── docs/                       # Documentação do projeto
```

---

## 🔧 Troubleshooting

### Backend não conecta ao banco

**Erro**: `❌ Unexpected database error`

**Solução**:
1. Verificar `DATABASE_URL` no `.env`
2. Testar conexão:
   ```bash
   psql $DATABASE_URL
   ```
3. Verificar se IP está autorizado no Supabase

### Frontend não conecta ao WebSocket

**Erro**: Chip "Desconectado" (vermelho) em SessionActive

**Solução**:
1. Verificar se backend está rodando em `http://localhost:3001`
2. Verificar `VITE_WS_URL` no `.env.local`
3. Verificar CORS no backend `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173
   ```
4. Reiniciar frontend após alterar `.env.local`

### Sessão não lista alunos

**Causa**: Turma não tem alunos cadastrados

**Solução**:
1. Login como direção
2. Ir em `/admin/users`
3. Criar alunos com role "aluno"
4. Ir em `/admin/classes`
5. Editar a turma e adicionar alunos

### CORS Error

**Erro**: `Access to XMLHttpRequest blocked by CORS`

**Solução**:
1. Verificar `ALLOWED_ORIGINS` no backend `.env`
2. Adicionar origem do frontend:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
3. Reiniciar backend

---

## 📝 Próximas Implementações

- ⏳ **PWA Aluno** - Interface mobile para alunos enviarem dados EEG reais
- ⏳ **Backend Metrics API** - Calcular métricas de sessões completas
- ⏳ **Integração EEG Real** - Conectar headset Neurosky TGAM
- ⏳ **Servidor Python EEG** - Bridge entre headset e WebSocket

---

## 📖 Documentação Completa

- [PROGRESSO-GERAL.md](PROGRESSO-GERAL.md) - Status do projeto
- [BACKEND-WEBSOCKET-IMPLEMENTADO.md](BACKEND-WEBSOCKET-IMPLEMENTADO.md) - Detalhes do backend
- [SESSION-ACTIVE-IMPLEMENTADO.md](SESSION-ACTIVE-IMPLEMENTADO.md) - Interface de monitoramento
- [SESSION-REPORT-IMPLEMENTADO.md](SESSION-REPORT-IMPLEMENTADO.md) - Interface de relatórios
- [neuroone-backend/README.md](neuroone-backend/README.md) - Documentação técnica do backend

---

## 🆘 Suporte

Em caso de problemas:
1. Verificar logs do backend no terminal
2. Verificar logs do frontend (console do navegador)
3. Consultar documentação em `/docs`
4. Verificar issues conhecidas no README

---

**Sistema NeuroOne** - Neurofeedback Educacional
**Versão**: 1.0.0 (Em Desenvolvimento)
**Última Atualização**: 2025-11-17
