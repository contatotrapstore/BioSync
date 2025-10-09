# 🔑 Como Obter Credenciais do Supabase - BioSync

**Projeto:** BioSync
**Project ID:** `uszmhhukjohjarplnlmp`
**Status Database:** ✅ 100% Configurado (13 tabelas + dados)

---

## 📍 Acesso Rápido

🔗 **Dashboard do Projeto:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp
🔗 **Página de API Keys:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/settings/api

---

## 🎯 Passo a Passo

### 1. Acessar Dashboard Supabase

1. Acesse: https://supabase.com
2. Faça login com sua conta
3. Selecione o projeto **"BioSync"**
4. Ou acesse diretamente: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp

### 2. Obter as API Keys

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Ou acesse direto: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/settings/api

### 3. Copiar as Chaves

Você verá 3 seções principais:

#### 📋 Section 1: Project URL
```
Project URL: https://uszmhhukjohjarplnlmp.supabase.co
```
✅ **Já configurado no .env**

#### 📋 Section 2: Project API keys

**A) anon / public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- ✅ Essa é a chave **pública** (pode ser exposta no frontend)
- 📝 Copie e cole em `SUPABASE_ANON_KEY` no arquivo `.env`

**B) service_role / secret key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- ⚠️ Essa é a chave **secreta** (NUNCA exponha no frontend!)
- 📝 Copie e cole em `SUPABASE_SERVICE_KEY` no arquivo `.env`
- ⚠️ Essa chave bypassa RLS (Row Level Security) - use apenas no backend!

---

## 📝 Atualizar Arquivo .env

Após copiar as chaves, edite o arquivo:

```bash
biosync-backend/.env
```

Substitua as linhas:

```env
# ANTES:
SUPABASE_ANON_KEY=OBTER_NO_DASHBOARD_BIOSYNC
SUPABASE_SERVICE_KEY=OBTER_NO_DASHBOARD_BIOSYNC

# DEPOIS (com suas chaves reais):
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzem1oaHVrampoamFycGxubG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0ODQ2ODIsImV4cCI6MjA0NDA2MDY4Mn0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzem1oaHVrampoamFycGxubG1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODQ4NDY4MiwiZXhwIjoyMDQ0MDYwNjgyfQ.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

---

## ✅ Verificar Configuração

Após atualizar o `.env`, teste se está funcionando:

```bash
# 1. Entre na pasta do backend
cd biosync-backend

# 2. Instale dependências (se não instalou ainda)
npm install

# 3. Inicie o servidor
npm run dev

# 4. Verifique se conectou ao Supabase
# Deve aparecer: "✓ Supabase conectado com sucesso"
```

---

## 🔍 Verificar Database

Confirme que o database está correto acessando:

🔗 **Table Editor:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/editor

Você deve ver **13 tabelas**:
- ✅ users (2 registros: admin + demo)
- ✅ games (13 jogos)
- ✅ subscription_plans (3 planos)
- ✅ plan_games (22 associações)
- ✅ subscriptions
- ✅ payments
- ✅ user_subscriptions
- ✅ launcher_sessions
- ✅ asaas_webhooks
- ✅ user_game_access
- ✅ access_history
- ✅ game_requests
- ✅ device_sessions

---

## 🧪 Testar API

Depois de configurar as chaves e iniciar o backend, teste:

### 1. Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "Welcome to BioSync API",
  "timestamp": "2025-10-09T..."
}
```

### 2. Testar Login Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@biosync.com",
    "password": "Admin@123456"
  }'
```

Deve retornar um token JWT:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@biosync.com",
    "is_admin": true
  }
}
```

### 3. Testar Listagem de Jogos
```bash
curl http://localhost:3000/api/v1/games
```

Deve retornar array com 13 jogos.

---

## 🚨 Troubleshooting

### Erro: "Invalid API key"
- ✅ Verifique se copiou a chave completa (são longas!)
- ✅ Não deve ter espaços ou quebras de linha
- ✅ Confirme que está usando o projeto correto (uszmhhukjohjarplnlmp)

### Erro: "Connection refused"
- ✅ Verifique se o projeto está ativo no Supabase
- ✅ Acesse https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp
- ✅ Status deve ser "Active"

### Erro: "Table doesn't exist"
- ✅ Confirme que todas as 13 tabelas foram criadas
- ✅ Acesse o Table Editor e verifique
- ✅ Se necessário, reexecute o script: `biosync-backend/supabase-schema-complete.sql`

---

## 📞 Credenciais de Teste

Após configurar tudo, use estas credenciais para testar:

| Tipo | Email | Senha | Uso |
|------|-------|-------|-----|
| **Admin** | admin@biosync.com | `Admin@123456` | Painel Admin + API |
| **Demo** | demo@biosync.com | `Demo@123456` | Launcher apenas |

---

## ✅ Checklist Final

Antes de fazer deploy, confirme:

- [ ] ✅ Obtive `SUPABASE_ANON_KEY`
- [ ] ✅ Obtive `SUPABASE_SERVICE_KEY`
- [ ] ✅ Atualizei `biosync-backend/.env`
- [ ] ✅ Testei conexão local (`npm run dev`)
- [ ] ✅ Testei login com admin@biosync.com
- [ ] ✅ Testei listagem de jogos
- [ ] ✅ Verifiquei que 13 tabelas existem no Supabase
- [ ] ✅ Verifiquei que 2 usuários existem (admin + demo)
- [ ] ✅ Verifiquei que 13 jogos existem
- [ ] ✅ Verifiquei que 3 planos existem

---

**Gerado em:** 2025-10-09
**Próximo passo:** Deploy no Render e Vercel
