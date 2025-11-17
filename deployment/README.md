# NeuroOne - Guia Completo de Deploy em Produção

Bem-vindo ao guia completo de deployment do sistema NeuroOne! Este documento organiza todos os passos necessários para colocar o projeto em produção.

## 📋 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIOS FINAIS                      │
│  Direção | Professores | Alunos (PWA Mobile/Desktop)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│            FRONTEND (React + Vite + MUI)                │
│                  Vercel Edge Network                     │
│         https://app.seudominio.com (Vercel)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ REST API + WebSocket
                     ▼
┌─────────────────────────────────────────────────────────┐
│          BACKEND (Node.js + Express + Socket.io)        │
│              Railway ou Render                          │
│    https://api.seudominio.com (Railway/Render)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ PostgreSQL REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│           DATABASE (PostgreSQL + RLS)                   │
│                  Supabase Cloud                         │
│         https://xxxxx.supabase.co                       │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Etapas de Deploy (Ordem Recomendada)

| Etapa | Componente | Plataforma | Tempo Estimado | Guia |
|-------|-----------|-----------|---------------|------|
| **1** | Database | Supabase | 30-45 min | [01-SUPABASE-SETUP.md](01-SUPABASE-SETUP.md) |
| **2** | Backend API | Railway/Render | 20-30 min | [02-BACKEND-DEPLOY.md](02-BACKEND-DEPLOY.md) |
| **3** | Frontend Web | Vercel | 15-20 min | [03-FRONTEND-DEPLOY.md](03-FRONTEND-DEPLOY.md) |

**Tempo Total**: ~1h15min - 1h45min

## 📝 Pré-requisitos

Antes de começar o deployment, certifique-se de ter:

### Contas nas Plataformas

- [ ] Conta no [Supabase](https://supabase.com) (gratuita)
- [ ] Conta no [Railway](https://railway.app) ou [Render](https://render.com) (gratuita)
- [ ] Conta no [Vercel](https://vercel.com) (gratuita)
- [ ] Conta no [GitHub](https://github.com) (para CI/CD)

### Ferramentas Locais

- [ ] Node.js 18+ instalado
- [ ] npm ou yarn instalado
- [ ] Git instalado
- [ ] Navegador moderno (Chrome/Firefox/Edge)

### Código Pronto

- [ ] Repositório Git com código do NeuroOne
- [ ] Backend testado localmente (`npm start` funciona)
- [ ] Frontend testado localmente (`npm run dev` funciona)
- [ ] Migrations SQL prontas (`neuroone-backend/migrations/`)

## 🚀 Guia Rápido (Quick Start)

Se você já conhece as plataformas e quer deploy rápido:

### 1. Supabase (5 min)

```bash
# 1. Criar projeto em https://app.supabase.com
# 2. Copiar credenciais (URL, anon key, service key)
# 3. Executar migrations via SQL Editor (5 arquivos)
```

### 2. Backend (5 min)

```bash
# Railway
railway login
railway init
railway up

# Ou Render: conectar via GitHub e configurar env vars
```

### 3. Frontend (5 min)

```bash
# Vercel CLI
vercel login
cd neuroone-frontend
vercel

# Ou Vercel Dashboard: conectar via GitHub
```

**Total**: ~15 minutos (se tudo der certo!)

## 📚 Guias Detalhados

### 1️⃣ [Configuração do Database (Supabase)](01-SUPABASE-SETUP.md)

**O que você vai fazer**:
- Criar projeto Supabase
- Executar 5 migrations SQL (schema, indexes, RLS, LGPD, seed data)
- Configurar Row Level Security policies
- Criar usuário admin padrão
- Testar conexão

**Pré-requisitos**: Nenhum

**Duração**: 30-45 minutos

**Outputs importantes**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

---

### 2️⃣ [Deploy do Backend (Railway/Render)](02-BACKEND-DEPLOY.md)

**O que você vai fazer**:
- Escolher entre Railway (fácil) ou Render (estável)
- Configurar variáveis de ambiente (Supabase keys, JWT secret, etc.)
- Deploy do Node.js + Express + Socket.io
- Configurar WebSocket CORS
- Testar endpoints da API

**Pré-requisitos**:
- ✅ Etapa 1 concluída (credenciais Supabase)

**Duração**: 20-30 minutos

**Outputs importantes**:
- `BACKEND_URL` (ex: https://neuroone-backend.onrender.com)

---

### 3️⃣ [Deploy do Frontend (Vercel)](03-FRONTEND-DEPLOY.md)

**O que você vai fazer**:
- Configurar variáveis de ambiente (Supabase, Backend URL)
- Deploy do React + Vite no Vercel Edge Network
- Configurar SPA routing (vercel.json)
- Testar login e dashboards
- Opcional: Configurar domínio customizado

**Pré-requisitos**:
- ✅ Etapa 1 concluída (credenciais Supabase)
- ✅ Etapa 2 concluída (Backend URL)

**Duração**: 15-20 minutos

**Outputs importantes**:
- `FRONTEND_URL` (ex: https://neuroone-frontend.vercel.app)

---

## ✅ Checklist Completo de Deploy

Use esta checklist para garantir que nada foi esquecido:

### Database (Supabase)

- [ ] Projeto Supabase criado
- [ ] Migration 001 (schema) executada
- [ ] Migration 002 (indexes) executada
- [ ] Migration 003 (LGPD) executada
- [ ] Migration 004 (RLS) executada
- [ ] Migration 005 (seed data) executada
- [ ] Admin user criado (`admin@neurogame.com`)
- [ ] **Senha do admin alterada** (CRÍTICO!)
- [ ] Credenciais anotadas (URL, keys)
- [ ] Backups automáticos habilitados
- [ ] Teste de conexão bem-sucedido

### Backend (Railway/Render)

- [ ] Serviço criado (Railway ou Render)
- [ ] Variáveis de ambiente configuradas:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `JWT_SECRET` (gerado com 32+ chars)
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=production`
  - [ ] `WS_CORS_ORIGIN` (domínio do frontend)
- [ ] Build bem-sucedido (sem erros)
- [ ] Logs sem erros críticos
- [ ] Endpoint `/health` retorna 200 OK
- [ ] Endpoint `/api/users` retorna dados (ou 401)
- [ ] WebSocket conecta via `wscat` ou navegador
- [ ] URL pública anotada

### Frontend (Vercel)

- [ ] Projeto importado do GitHub
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_API_URL` (URL do backend)
  - [ ] `VITE_WS_URL` (WebSocket URL do backend)
- [ ] Build bem-sucedido (sem erros)
- [ ] `vercel.json` configurado (SPA routing)
- [ ] Deploy automático via Git habilitado
- [ ] Página de login acessível
- [ ] Login com admin funciona
- [ ] Dashboard direção carrega sem erros
- [ ] Dashboard professor carrega sem erros
- [ ] Sem erros CORS no console do navegador
- [ ] WebSocket conecta (verificado no Network tab)
- [ ] URL pública anotada
- [ ] (Opcional) Domínio customizado configurado
- [ ] (Opcional) Analytics habilitado

### Testes End-to-End

- [ ] Fluxo completo funciona:
  1. [ ] Direção faz login
  2. [ ] Direção cria professor
  3. [ ] Direção cria turma
  4. [ ] Professor faz login
  5. [ ] Professor cria sessão
  6. [ ] Professor inicia sessão
  7. [ ] Aluno acessa PWA mobile
  8. [ ] Aluno conecta headset (via Bluetooth)
  9. [ ] Dados EEG são transmitidos em tempo real
  10. [ ] Dashboard do professor mostra métricas ao vivo
  11. [ ] Professor finaliza sessão
  12. [ ] Relatório é gerado e exibido

## 🔒 Segurança Pós-Deploy

**CRÍTICO - Execute imediatamente após deploy**:

1. **Alterar senha do admin**:
   ```sql
   -- No Supabase SQL Editor
   UPDATE users
   SET password_hash = '$2b$10$SEU_NOVO_HASH'
   WHERE email = 'admin@neurogame.com';
   ```

2. **Configurar CORS específico** (não usar `*` em produção):
   ```env
   # Backend
   WS_CORS_ORIGIN=https://app.seudominio.com
   ```

3. **Proteger variáveis de ambiente**:
   - ✅ Nunca commitar `.env` no Git
   - ✅ `SUPABASE_SERVICE_KEY` apenas no backend (nunca frontend)
   - ✅ Usar variáveis de ambiente da plataforma (Railway/Vercel)

4. **Habilitar autenticação JWT** em todos os endpoints protegidos

5. **Revisar RLS policies** no Supabase (migration 004)

6. **Configurar rate limiting** no backend (opcional):
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/', rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   }));
   ```

## 📊 Monitoramento e Logs

### Supabase

- **Database Logs**: Dashboard > Database > Logs
- **API Logs**: Dashboard > API > Logs
- **Performance**: Dashboard > Database > Query Performance

### Backend (Railway/Render)

- **Logs em tempo real**: Dashboard > Deployments > View Logs
- **Métricas**: Dashboard > Metrics (CPU, RAM, response time)

### Frontend (Vercel)

- **Deployment Logs**: Dashboard > Deployments > [seu deploy] > Logs
- **Analytics**: Dashboard > Analytics (habilitar se necessário)
- **Errors**: Integrar com Sentry (opcional)

## 🛠️ Troubleshooting Comum

| Problema | Possível Causa | Solução |
|----------|---------------|---------|
| Build falha no backend | Dependência faltando | `npm install` e verificar `package.json` |
| "Database connection refused" | Credenciais Supabase incorretas | Verificar `SUPABASE_URL` e keys |
| CORS error no frontend | Backend não permite origem | Configurar `WS_CORS_ORIGIN` no backend |
| 404 em rotas React (`/teacher`) | `vercel.json` não configurado | Adicionar regra de fallback para `/index.html` |
| WebSocket não conecta | URL incorreta ou protocolo errado | Usar `wss://` (não `ws://`) e verificar firewall |
| "Permission denied" no Supabase | RLS bloqueando acesso | Usar `SUPABASE_SERVICE_KEY` no backend |
| Variáveis `undefined` no frontend | Não têm prefixo `VITE_` | Renomear para `VITE_*` e redeploy |

## 💰 Custos Mensais Estimados

### Plano Gratuito (Testes/Piloto)

| Serviço | Plano | Custo | Limitações |
|---------|-------|-------|------------|
| Supabase | Free | $0 | 500MB DB, 2GB bandwidth/mês |
| Railway | Free | $0 | $5 crédito/mês (~100h uptime) |
| Vercel | Hobby | $0 | Bandwidth ilimitado, 100GB/mês |
| **TOTAL** | | **$0/mês** | Adequado para <50 usuários/mês |

### Plano Produção (Escola com 500+ alunos)

| Serviço | Plano | Custo | Benefícios |
|---------|-------|-------|-----------|
| Supabase | Pro | $25/mês | 8GB DB, 50GB bandwidth, backups diários |
| Render | Starter | $7/mês | 512MB RAM, uptime 24/7, SSL, SLA |
| Vercel | Pro | $20/mês | Analytics avançado, maior bandwidth |
| **TOTAL** | | **$52/mês** | SLA 99.9%, suporte, escalável |

## 📞 Suporte e Recursos

### Documentação Oficial

- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Comunidades

- [Supabase Discord](https://discord.supabase.com)
- [Railway Discord](https://discord.gg/railway)
- [Vercel Discord](https://discord.gg/vercel)

### Documentação do Projeto NeuroOne

- Documentação técnica completa em `docs/`
- Schema do banco de dados: `docs/04-DATABASE-SCHEMA.md`
- Endpoints da API: `docs/05-API-ENDPOINTS.md`
- Especificação WebSocket: `docs/06-WEBSOCKET-SPEC.md`

## 🎯 Próximos Passos Após Deploy

Após concluir o deploy completo:

1. **Implementar Web Bluetooth API** (conexão direta com headsets via navegador)
   - Criar módulo `bluetooth.js` no frontend
   - Portar parser ThinkGear do Python para JavaScript
   - Integrar com componente StudentSession

2. **Executar testes de integração**:
   - Criar usuários de teste (direção, professor, aluno)
   - Simular sessões completas
   - Testar transmissão de dados EEG
   - Validar geração de relatórios

3. **Lançar piloto com usuários reais**:
   - Selecionar 1-2 turmas piloto
   - Treinar professores no uso da plataforma
   - Coletar feedback
   - Iterar com melhorias

4. **Escalar para produção**:
   - Upgrade de planos conforme necessário
   - Configurar monitoramento avançado (Sentry, New Relic)
   - Implementar CI/CD com testes automatizados
   - Documentar processos operacionais

## ✨ Conclusão

Seguindo este guia, você terá o sistema NeuroOne completo funcionando em produção com:

- ✅ Database PostgreSQL escalável (Supabase)
- ✅ Backend Node.js com API REST e WebSocket (Railway/Render)
- ✅ Frontend React otimizado (Vercel)
- ✅ HTTPS e SSL automáticos
- ✅ Row Level Security (RLS) para proteção de dados
- ✅ Compliance com LGPD
- ✅ Backups automáticos
- ✅ CI/CD via Git

**Bom deploy! 🚀**

---

**Última atualização**: 2025-01-17
**Versão**: 1.0.0
**Autor**: Claude Code
**Licença**: MIT
