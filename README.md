# 🎮 NeuroOne Platform

**Sistema completo de jogos cognitivos com dashboard administrativo e launcher desktop.**

**Versão:** 2.1.0 | **Status:** ✅ Produção | **Última Atualização:** 16/10/2025

---

## 📖 Documentação

A documentação completa está organizada na pasta [docs/](docs/):

### 🚀 Começando
- **[Primeiro Acesso](docs/setup/PRIMEIRO_ACESSO.md)** - Guia completo para configurar e acessar o sistema pela primeira vez
- **[Credenciais Admin](docs/setup/CREDENCIAIS_ADMIN.md)** - Credenciais administrativas e de teste
- **[Configuração Supabase](docs/setup/SUPABASE_SETUP.md)** - Como configurar e obter credenciais do Supabase

### 🌐 Deploy e Produção
- **[Guia Completo de Deploy](docs/deploy/GUIA_DEPLOY_PRODUCAO.md)** - Deploy completo em produção
- **[Backend no Render](biosync-backend/DEPLOY_RENDER.md)** - Deploy da API REST
- **[Admin no Vercel](biosync-admin/DEPLOY_VERCEL.md)** - Deploy do dashboard administrativo

### 🔌 Desenvolvimento
- **[Integração de Jogos](docs/api/INTEGRACAO_JOGOS.md)** - Como adicionar novos jogos na plataforma

### 📜 Referência
- **[Histórico: Migração NeuroGame](docs/migration/HISTORICO_MIGRACAO_NEUROGAME.md)** - Documentação da migração completa

---

## 🏗️ Arquitetura

### Backend ([biosync-backend/](biosync-backend/))
- Node.js + Express + Supabase
- JWT Authentication
- Sistema de Assinaturas (PIX + Cartão via Asaas)
- Sistema de Psicólogos e Pacientes
- Sistema de Pontuações de Jogos
- **Deploy:** https://neurogame-7av9.onrender.com

### Admin Panel ([biosync-admin/](biosync-admin/))
- React 18 + Material-UI v5
- Dashboard administrativo completo
- Gestão de usuários, jogos e assinaturas
- Dashboard de psicólogos com gráficos (Recharts)
- **Deploy:** https://neuro-game-nu.vercel.app

### Launcher ([biosync-launcher/](biosync-launcher/))
- Electron + React 18
- Aplicação desktop multiplataforma
- Biblioteca de jogos
- Sistema de autenticação e validação de assinaturas
- Auto-update

---

## 🎮 Jogos Disponíveis (13)

| # | Jogo | Categoria | Slug |
|---|------|-----------|------|
| 1 | Autorama | Corrida | autorama |
| 2 | Balão | Aventura | balao |
| 3 | Batalha de Tanques | Ação | batalha-de-tanques |
| 4 | Correndo pelos Trilhos | Corrida | correndo-pelos-trilhos |
| 5 | Desafio Aéreo | Simulação | desafio-aereo |
| 6 | Desafio Automotivo | Corrida | desafio-automotivo |
| 7 | Desafio nas Alturas | Aventura | desafio-nas-alturas |
| 8 | Fazendinha | Simulação | fazendinha |
| 9 | Labirinto | Puzzle | labirinto |
| 10 | Missão Espacial | Aventura | missao-espacial |
| 11 | Resgate em Chamas | Ação | resgate-em-chamas |
| 12 | Taxi City | Simulação | taxi-city |
| 13 | Tesouro do Mar | Aventura | tesouro-do-mar |

---

## 🚀 Quick Start

### 1. Backend
```bash
cd biosync-backend
npm install
# Configure .env (ver docs/setup/SUPABASE_SETUP.md)
npm run dev
```

### 2. Admin Panel
```bash
cd biosync-admin
npm install
# Configure VITE_API_URL no .env
npm run dev
```

### 3. Launcher
```bash
cd biosync-launcher
npm install
npm run dev
```

---

## 🔐 Acesso Rápido

### Painel Administrativo
- **URL:** https://neuro-game-nu.vercel.app
- **Login:** `psitalessales` / `23112018Vt!`

### API Backend
- **URL:** https://neurogame-7av9.onrender.com/api/v1
- **Health:** https://neurogame-7av9.onrender.com/api/v1/health

Ver [Credenciais Admin](docs/setup/CREDENCIAIS_ADMIN.md) para credenciais completas.

---

## 💾 Database

**Plataforma:** Supabase (PostgreSQL v17.6.1)
**Project ID:** uszmhhukjohjarplnlmp
**Region:** South America (sa-east-1)

### Tabelas (15)
- Usuários e Autenticação: `users`, `launcher_sessions`
- Assinaturas: `subscriptions`, `payments`, `asaas_webhooks`
- Jogos: `games`, `user_game_access`, `game_requests`
- Psicólogos: `psychologist_patients`, `game_scores`
- Planos: `subscription_plans`, `plan_games`

---

## 🛠️ Stack Tecnológica

**Backend:** Node.js 18, Express.js, Supabase, JWT, Asaas API
**Frontend Admin:** React 18, Material-UI v5, Recharts, React Query
**Launcher:** Electron 29, React 18, Material-UI v5
**Database:** PostgreSQL 17 + RLS Policies
**Deploy:** Render.com (backend), Vercel (admin)

---

## ✅ Status Atual

- ✅ Backend em produção (Render.com)
- ✅ Admin Panel em produção (Vercel)
- ✅ Database configurado (Supabase)
- ✅ Sistema de Assinaturas (Asaas)
- ✅ Sistema de Psicólogos
- ✅ Sistema de Pontuações
- ✅ 13 jogos disponíveis
- ✅ Launcher desktop (v2.1.0)

---

## 📞 Suporte

Para configuração e troubleshooting, consulte:
- [Primeiro Acesso](docs/setup/PRIMEIRO_ACESSO.md) - Guia completo
- [Troubleshooting](docs/setup/PRIMEIRO_ACESSO.md#troubleshooting) - Problemas comuns

---

## 📄 Licença

© 2025 NeuroOne - Todos os direitos reservados

---

**Desenvolvido com ❤️ pela equipe NeuroOne**
