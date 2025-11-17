# 🚀 SETUP NEUROONE - Implementação Iniciada

## ✅ SPRINT 0 - CONCLUÍDO (2025-11-17)

### Infraestrutura Criada

**Projeto Supabase**: NeuroOne Educacional
**ID**: `fsszpnbuabhhvrdmrtct`
**Região**: sa-east-1 (São Paulo)
**Status**: ✅ ACTIVE_HEALTHY
**PostgreSQL**: 17.6.1
**Custo**: $10/mês

### Database Schema Aplicado

**✅ 9 Tabelas Criadas:**
1. `users` - Usuários do sistema (direção, professor, aluno)
2. `classes` - Turmas
3. `class_students` - Relacionamento aluno-turma
4. `sessions` - Sessões de aula com EEG
5. `session_participants` - Participantes de cada sessão
6. `eeg_data` - Dados EEG brutos (atenção, relaxamento, ondas cerebrais)
7. `session_metrics` - Métricas agregadas por sessão
8. `student_metrics` - Métricas por aluno
9. `launcher_sessions` - Sessões do launcher desktop

**✅ Segurança Configurada:**
- Row Level Security (RLS) ativado em todas as tabelas
- 19 policies implementadas
- Isolamento por tipo de usuário (direção/professor/aluno)

---

## 🔐 CREDENCIAIS

### Supabase

```bash
# URL do projeto
SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co

# Chave pública (anon key)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzE2NDQsImV4cCI6MjA3ODk0NzY0NH0.bpzj-J6E3NEV16Y51x1lov9G_sIjMbxG7wfz45s1VXA
```

### Database Connection

```
Host: db.fsszpnbuabhhvrdmrtct.supabase.co
Database: postgres
Port: 5432
```

---

## 📁 PRÓXIMOS PASSOS - SPRINT 1-2 (Semanas 1-3)

### 1. Setup Frontend (React + Vite)

```bash
# Criar projeto Vite
npm create vite@latest neuroone-frontend -- --template react
cd neuroone-frontend

# Instalar dependências
npm install @supabase/supabase-js
npm install react-router-dom
npm install tailwindcss postcss autoprefixer
npm install chart.js react-chartjs-2
npm install date-fns
npm install lucide-react  # Ícones

# Configurar Tailwind
npx tailwindcss init -p

# Criar .env.local
echo "VITE_SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzE2NDQsImV4cCI6MjA3ODk0NzY0NH0.bpzj-J6E3NEV16Y51x1lov9G_sIjMbxG7wfz45s1VXA" >> .env.local
```

#### Estrutura de Diretórios

```
neuroone-frontend/
├── src/
│   ├── components/
│   │   ├── atoms/       # Button, Input, Card
│   │   ├── molecules/   # LoginForm, StudentCard
│   │   └── organisms/   # Dashboard, SessionMonitor
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── admin/       # Módulo Direção
│   │   ├── teacher/     # Módulo Professor
│   │   └── student/     # Módulo Aluno (PWA)
│   ├── services/
│   │   ├── supabase.js
│   │   └── auth.js
│   ├── styles/
│   │   ├── tokens.css   # Design System tokens
│   │   └── globals.css
│   ├── hooks/
│   └── utils/
├── public/
│   └── manifest.json    # PWA manifest
└── .env.local
```

### 2. Setup Backend (Node.js)

```bash
# Criar projeto backend
mkdir neuroone-backend
cd neuroone-backend
npm init -y

# Instalar dependências
npm install express
npm install @supabase/supabase-js
npm install ws  # WebSocket
npm install cors
npm install helmet
npm install dotenv
npm install bcrypt
npm install jsonwebtoken

# Dev dependencies
npm install --save-dev nodemon

# Criar .env
echo "SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co" > .env
echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzE2NDQsImV4cCI6MjA3ODk0NzY0NH0.bpzj-J6E3NEV16Y51x1lov9G_sIjMbxG7wfz45s1VXA" >> .env
echo "PORT=3001" >> .env
echo "JWT_SECRET=your-super-secret-key-change-this" >> .env
```

#### Estrutura Backend

```
neuroone-backend/
├── src/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── classes.js
│   │   ├── sessions.js
│   │   └── eeg.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── supabase.js
│   │   └── websocket.js
│   ├── utils/
│   └── server.js
├── .env
└── package.json
```

### 3. Adaptar Servidor Python EEG

```bash
# Copiar servidor existente
cp "../server_headless-V4.py" neuroone-python/server.py

# Criar requirements.txt
cd neuroone-python
cat > requirements.txt <<EOF
fastapi==0.109.0
uvicorn==0.27.0
websockets==12.0
python-dotenv==1.0.0
pandas==2.1.4
numpy==1.26.3
pyserial==3.5
EOF

# Instalar dependências
pip install -r requirements.txt

# Criar .env
echo "WEBSOCKET_PORT=8080" > .env
echo "SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co" >> .env
```

---

## 🎯 TAREFAS SPRINT 1 (Semana 1)

### Frontend

- [ ] Setup Vite + React
- [ ] Configurar Tailwind CSS
- [ ] Implementar Design System tokens ([docs/02-DESIGN-SYSTEM.md](docs/02-DESIGN-SYSTEM.md))
- [ ] Criar componentes base:
  - [ ] Button
  - [ ] Input
  - [ ] Card
  - [ ] Container
  - [ ] Header
- [ ] Implementar tema dark/light
- [ ] Configurar React Router
- [ ] Página de Login
- [ ] Context API para Auth

### Backend

- [ ] Setup Express server
- [ ] Configurar CORS
- [ ] Middleware de autenticação
- [ ] Endpoint POST /api/auth/login
- [ ] Endpoint POST /api/auth/register
- [ ] Endpoint GET /api/auth/me
- [ ] Configurar WebSocket server
- [ ] Testes básicos (Jest)

### Dados Iniciais

- [ ] Criar usuário admin:
  ```sql
  INSERT INTO users (email, password_hash, name, user_role)
  VALUES (
    'admin@neuroone.com',
    '$2a$10$...', -- hash de "Admin123"
    'Administrador',
    'direcao'
  );
  ```

---

## 🎮 JOGOS THREE.JS (Paralelo - Semana 1-6)

Começar com 2 jogos simples:

### Jogo 1: Atenção Contínua

```bash
# Setup Three.js
npm install three
npm install @react-three/fiber @react-three/drei

# Criar estrutura
mkdir -p src/games/atencao-continua
```

Ver especificação completa em: [docs/24-JOGOS-NEUROFEEDBACK.md](docs/24-JOGOS-NEUROFEEDBACK.md)

### Jogo 2: Memória de Trabalho

Ver: [docs/24-JOGOS-NEUROFEEDBACK.md](docs/24-JOGOS-NEUROFEEDBACK.md)

---

## 📊 CHECKLIST COMPLETO

Consultar: [docs/19-CHECKLIST-COMPLETO.md](docs/19-CHECKLIST-COMPLETO.md)

**Progresso Atual:**
- ✅ Sprint 0: Setup Infraestrutura (100%)
- 🕒 Sprint 1-2: Fundação (0%)

---

## 📖 DOCUMENTAÇÃO TÉCNICA

Toda documentação está em [docs/](docs/):

**Essenciais para começar:**
- [00-PROJETO-OVERVIEW.md](docs/00-PROJETO-OVERVIEW.md) - Visão geral
- [02-DESIGN-SYSTEM.md](docs/02-DESIGN-SYSTEM.md) - Design tokens e componentes
- [04-DATABASE-SCHEMA.md](docs/04-DATABASE-SCHEMA.md) - Schema completo (já aplicado)
- [05-API-ENDPOINTS.md](docs/05-API-ENDPOINTS.md) - Endpoints a implementar
- [06-WEBSOCKET-SPEC.md](docs/06-WEBSOCKET-SPEC.md) - Especificação WebSocket
- [07-FASE-1-FUNDACAO.md](docs/07-FASE-1-FUNDACAO.md) - Guia detalhado Sprint 1-2

---

## 🚨 RISCOS MONITORADOS

Ver: [docs/22-RISCOS-MITIGACOES.md](docs/22-RISCOS-MITIGACOES.md)

**Críticos:**
- 🔴 R01: Latência Bluetooth (>100ms)
- 🔴 R05: Safari sem Web Bluetooth (focar Android)
- 🟠 R12: Scope creep (seguir MVP)

---

## 💰 CUSTOS ATUAIS

- **Supabase Projeto NeuroOne**: $10/mês
- **Desenvolvimento**: $0 (grátis até deploy)

**Custos futuros (Sprint 12 - Deploy):**
- Supabase Pro: $25/mês
- Railway Backend: $5/mês
- Railway Python: $5/mês
- **Total produção**: ~$45/mês

---

## 📞 PRÓXIMA AÇÃO

**Começar agora:**

```bash
# 1. Criar frontend
npm create vite@latest neuroone-frontend -- --template react
cd neuroone-frontend && npm install

# 2. Copiar credenciais para .env.local
# (ver seção "Credenciais" acima)

# 3. Seguir guia detalhado
# docs/07-FASE-1-FUNDACAO.md
```

---

**Última atualização**: 2025-11-17
**Status**: ✅ Sprint 0 Completo | 🟡 Pronto para Sprint 1
