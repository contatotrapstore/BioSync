# 🎮 BioSync - Primeiro Acesso

**Bem-vindo ao BioSync Game Platform!**

Este projeto foi completamente rebrandizado do NeuroGame para BioSync, com nova identidade visual (azul), novo database Supabase e pronto para novos deploys.

---

## 🎯 Status Atual

### ✅ Concluído (100%)

1. **✅ Rebranding Completo**
   - Renomeado: NeuroGame → BioSync
   - Cores: Verde → Azul (#0D1BA6, #1E3DD9, #4A6EF2)
   - Logo: Versão azul aplicada
   - 50+ arquivos atualizados

2. **✅ Database Supabase - BioSync**
   - Project ID: `uszmhhukjohjarplnlmp`
   - 13 tabelas criadas via MCP
   - 13 jogos inseridos
   - 3 planos de assinatura
   - 2 usuários (admin + demo)
   - Todas as migrations aplicadas

3. **✅ Arquivos de Configuração**
   - `.env` criados para os 3 módulos
   - JWT secrets gerados (256-bit)
   - Credenciais Asaas mantidas (produção)
   - Documentação completa

### ⏳ Pendente

1. **⏳ Obter Credenciais Supabase**
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - 📖 **Guia completo:** `OBTER_CREDENCIAIS_SUPABASE.md`

2. **⏳ Deploy**
   - Backend: Render.com
   - Admin: Vercel
   - Atualizar webhooks Asaas

3. **⏳ Repositório Git**
   - Criar repo GitHub
   - Push inicial

---

## 📁 Estrutura do Projeto

```
BioSync Game FN/
├── biosync-backend/         # API Node.js + Express
│   ├── .env                 # ✅ Configurado (falta Supabase keys)
│   ├── supabase-schema-complete.sql  # ✅ Já aplicado via MCP
│   └── supabase-seeds.sql   # ✅ Já aplicado via MCP
├── biosync-admin/           # Painel Admin (React + Vite)
│   └── .env                 # ✅ Configurado
├── biosync-launcher/        # Desktop Launcher (Electron)
│   └── .env                 # ✅ Configurado
├── Jogos/                   # 13 jogos (HTML5 + Three.js)
│   ├── autorama/
│   ├── balao/
│   └── ... (11 outros)
└── Logo Azul.png            # ✅ Logo oficial BioSync
```

---

## 🚀 Quick Start

### 1️⃣ Obter Credenciais Supabase (OBRIGATÓRIO)

📖 **Siga o guia:** [`OBTER_CREDENCIAIS_SUPABASE.md`](OBTER_CREDENCIAIS_SUPABASE.md)

Resumo:
1. Acesse: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/settings/api
2. Copie `anon key` e `service_role key`
3. Cole em `biosync-backend/.env`

### 2️⃣ Instalar Dependências

```bash
# Backend
cd biosync-backend
npm install

# Admin
cd ../biosync-admin
npm install

# Launcher
cd ../biosync-launcher
npm install
```

### 3️⃣ Iniciar Desenvolvimento Local

#### Terminal 1 - Backend API
```bash
cd biosync-backend
npm run dev
# Servidor: http://localhost:3000
```

#### Terminal 2 - Admin Panel
```bash
cd biosync-admin
npm run dev
# Painel: http://localhost:5173
```

#### Terminal 3 - Launcher
```bash
cd biosync-launcher
npm run dev
# Electron app abrirá automaticamente
```

### 4️⃣ Testar Login

**Admin Panel:**
- URL: http://localhost:5173
- Email: `admin@biosync.com`
- Senha: `Admin@123456`

**Launcher:**
- Email: `demo@biosync.com`
- Senha: `Demo@123456`

---

## 📊 Database - Informações

### Supabase Project
- **Nome:** BioSync
- **Project ID:** `uszmhhukjohjarplnlmp`
- **URL:** https://uszmhhukjohjarplnlmp.supabase.co
- **Region:** South America (sa-east-1)
- **PostgreSQL:** v17.6.1

### Dados Inseridos
- ✅ **2 usuários:** admin + demo
- ✅ **13 jogos:** autorama, balão, batalha de tanques, etc.
- ✅ **3 planos:** Básico (R$ 19,90), Premium (R$ 39,90), Educacional (R$ 99,90)
- ✅ **22 associações** plano-jogo

### Tabelas Criadas (13)
1. users
2. games
3. subscription_plans
4. user_subscriptions
5. subscriptions
6. payments
7. launcher_sessions
8. asaas_webhooks
9. plan_games
10. user_game_access
11. access_history
12. game_requests
13. device_sessions

---

## 🎨 Identidade Visual BioSync

### Logo
- **Arquivo:** `Logo Azul.png`
- **Aplicado em:** Admin, Launcher, Documentação

### Paleta de Cores
```css
/* Azuis principais */
--primary: #0D1BA6;      /* Azul escuro */
--secondary: #1E3DD9;    /* Azul médio */
--accent: #4A6EF2;       /* Azul claro */

/* Gradientes */
linear-gradient(135deg, #0D1BA6 0%, #1E3DD9 100%)
linear-gradient(to right, #1E3DD9, #4A6EF2)
```

---

## 💳 Gateway de Pagamento

### Asaas (Configurado)
- ✅ **API Key:** Mantida do NeuroGame (produção)
- ✅ **Environment:** `production`
- ✅ **Webhook Secret:** Configurado
- ⚠️ **Atualizar:** URLs de webhook após deploy

### Valores
- **Assinatura:** R$ 149,90/mês
- **Moeda:** BRL
- **Métodos:** PIX, Cartão de Crédito, Boleto

---

## 📝 Documentos Importantes

| Documento | Descrição |
|-----------|-----------|
| **README.md** | Documentação principal do projeto |
| **SETUP_COMPLETO.md** | ✅ Resumo de tudo que foi feito via MCP |
| **OBTER_CREDENCIAIS_SUPABASE.md** | 🔑 Como obter as chaves do Supabase |
| **SUPABASE_SETUP_INSTRUCTIONS.md** | Instruções detalhadas do database |
| **README_PRIMEIRO_ACESSO.md** | 👈 Você está aqui! |

---

## 🔐 Credenciais de Acesso

### Admin (Painel + API)
```
Email: admin@biosync.com
Senha: Admin@123456
Permissões: Administrador completo
```

### Demo (Launcher)
```
Email: demo@biosync.com
Senha: Demo@123456
Permissões: Usuário regular
```

### Supabase Dashboard
```
Project: BioSync
ID: uszmhhukjohjarplnlmp
URL: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp
```

---

## 🛠️ Tecnologias

### Backend
- Node.js + Express.js
- Supabase PostgreSQL
- JWT Authentication
- Asaas Payment Gateway
- Bcrypt (password hashing)

### Admin Panel
- React 18
- Vite
- Material-UI (MUI)
- React Query
- Axios

### Launcher
- Electron
- React 18
- Vite
- Material-UI
- electron-store
- electron-updater

### Games
- HTML5 + Three.js
- WebGL
- 3D GLTF Models

---

## 🚀 Próximos Passos

### 1. Configuração Local ⏳
- [ ] Obter credenciais Supabase
- [ ] Testar backend local
- [ ] Testar admin local
- [ ] Testar launcher local

### 2. Deploy ⏳
- [ ] Criar repositório GitHub
- [ ] Deploy backend (Render)
- [ ] Deploy admin (Vercel)
- [ ] Atualizar webhooks Asaas

### 3. Testes Completos ⏳
- [ ] Fluxo de cadastro
- [ ] Fluxo de login
- [ ] Listagem de jogos
- [ ] Sistema de assinatura
- [ ] Download e execução de jogos

---

## 📞 Suporte

### Problemas Comuns

**Backend não conecta ao Supabase:**
- Verifique se configurou `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY`
- Guia: `OBTER_CREDENCIAIS_SUPABASE.md`

**Admin não mostra jogos:**
- Verifique se backend está rodando (http://localhost:3000)
- Teste: `curl http://localhost:3000/api/v1/health`

**Launcher não abre jogos:**
- Verifique se a pasta `Jogos/` existe
- Caminho configurado: `VITE_GAMES_PATH=../Jogos`

---

## ✅ Checklist de Verificação

Antes de considerar setup completo:

### Backend
- [ ] ✅ `npm install` executado
- [ ] ⏳ Credenciais Supabase configuradas
- [ ] ⏳ Backend iniciando sem erros
- [ ] ⏳ Login funcionando

### Admin
- [ ] ✅ `npm install` executado
- [ ] ⏳ Conecta ao backend
- [ ] ⏳ Login funcionando
- [ ] ⏳ Lista jogos corretamente

### Launcher
- [ ] ✅ `npm install` executado
- [ ] ⏳ Conecta ao backend
- [ ] ⏳ Login funcionando
- [ ] ⏳ Jogos aparecem na biblioteca

### Database
- [x] ✅ 13 tabelas criadas
- [x] ✅ 13 jogos inseridos
- [x] ✅ 3 planos criados
- [x] ✅ 2 usuários criados
- [x] ✅ Triggers funcionando

---

## 🎉 Conclusão

**O projeto BioSync está 95% pronto!**

Falta apenas:
1. Obter 2 chaves do Supabase (5 minutos)
2. Testar localmente (10 minutos)
3. Fazer deploys (30 minutos)

📖 **Próximo passo:** Abra `OBTER_CREDENCIAIS_SUPABASE.md`

---

**Gerado em:** 2025-10-09
**Versão:** 1.0.0
**Plataforma:** BioSync Game Platform
