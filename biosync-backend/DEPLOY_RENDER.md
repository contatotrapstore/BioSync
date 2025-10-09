# 🚀 Deploy do Backend no Render - Passo a Passo

## ✅ Pré-requisitos

- [x] Conta no GitHub (https://github.com)
- [x] Conta no Render (https://render.com)
- [x] Conta no Supabase (https://supabase.com)
- [x] Código no GitHub (repositório criado)

---

## 📋 Visão Geral

O Render é uma plataforma moderna de deploy que oferece:

- ✅ **Plano gratuito** para começar (sem cartão de crédito)
- ✅ Deploy automático a cada push no GitHub
- ✅ HTTPS automático (certificado SSL grátis)
- ✅ Logs em tempo real
- ✅ Fácil configuração de variáveis de ambiente
- ✅ PostgreSQL, Redis embutidos (se precisar)
- ✅ Sem "sleep" após inatividade (no plano free também)

**Tempo estimado:** 15-20 minutos

---

## 🔧 ETAPA 1: Preparar Supabase

### 1.1 Obter Credenciais do Supabase

1. **Acesse:** https://app.supabase.com
2. **Selecione** seu projeto (ou crie um novo)
3. **Vá em:** Settings → API
4. **Copie as seguintes informações:**

```
Project URL: https://seu-projeto.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:** A `service_role key` é SECRETA! Nunca exponha publicamente.

---

## 🌐 ETAPA 2: Deploy no Render

### 2.1 Criar Conta no Render

1. **Acesse:** https://render.com
2. **Clique em:** "Get Started" → "Sign Up"
3. **Escolha:** "Sign up with GitHub"
4. **Autorize** o Render a acessar sua conta GitHub
5. **Plano Free** é automático - não precisa cartão!

### 2.2 Criar Novo Web Service

1. **No dashboard, clique em:** "New +"
2. **Selecione:** "Web Service"
3. **Autorize o Render** a acessar seus repositórios (se ainda não fez)
4. **Encontre e selecione** o repositório `neurogame-platform`
5. **Clique em "Connect"**

### 2.3 Configurar o Serviço

Na tela de configuração:

#### 📝 Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Name** | `neurogame-backend` |
| **Region** | `Oregon (US West)` ou mais próximo |
| **Branch** | `master` (ou `main`) |
| **Root Directory** | `neurogame-backend` ⚠️ IMPORTANTE! |
| **Runtime** | `Node` (detectado automaticamente) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

#### 💰 Plano

- **Instance Type:** Selecione **"Free"**
  - 512MB RAM
  - Shared CPU
  - **$0/mês** 🎉

#### 🔐 Variáveis de Ambiente

**IMPORTANTE:** Role até a seção "Environment Variables" e adicione TODAS as variáveis abaixo:

**Clique em "Add Environment Variable"** para cada uma:

```env
NODE_ENV=production
PORT=10000

# Supabase (SUBSTITUA com suas chaves reais!)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_KEY=sua_chave_service_role_aqui

# JWT (GERE chaves fortes!)
JWT_SECRET=sua-chave-secreta-jwt-256-bits
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=outra-chave-secreta-diferente
JWT_REFRESH_EXPIRES_IN=7d

# Asaas (use sandbox para testes)
ASAAS_API_KEY=sua_chave_asaas
ASAAS_WEBHOOK_SECRET=seu_webhook_secret
ASAAS_ENVIRONMENT=sandbox

# Planos
SUBSCRIPTION_VALUE=149.90
SUBSCRIPTION_CURRENCY=BRL

# Limites
MAX_DEVICES_PER_USER=3
HEARTBEAT_INTERVAL_HOURS=12
OFFLINE_GRACE_PERIOD_HOURS=48

# CORS (ADICIONE depois do deploy do admin!)
CORS_ORIGIN=https://seu-admin.vercel.app
ALLOWED_ORIGINS=https://seu-admin.vercel.app

# Logs
LOG_LEVEL=info
```

**💡 Como gerar chaves JWT fortes:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Execute 2 vezes para gerar `JWT_SECRET` e `JWT_REFRESH_SECRET` diferentes.

#### 🏥 Health Check (Opcional mas Recomendado)

- **Health Check Path:** `/api/v1/health`

### 2.4 Criar o Serviço

1. **Revise todas as configurações**
2. **Clique em "Create Web Service"**
3. **O Render vai:**
   - Clonar seu repositório
   - Instalar dependências (`npm install`)
   - Iniciar o servidor (`npm start`)
   - Gerar uma URL pública

4. **Aguarde** (leva 3-5 minutos no primeiro deploy)
5. **Acompanhe os logs** em tempo real

---

## 🎯 ETAPA 3: Obter URL e Testar

### 3.1 URL Pública

Após deploy bem-sucedido, o Render gera uma URL:

```
https://neurogame-backend.onrender.com
```

**Copie essa URL** - você vai precisar dela!

### 3.2 Testar a API

Abra o navegador ou use curl:

```bash
# Health check
curl https://neurogame-backend.onrender.com/api/v1/health

# Deve retornar:
{
  "status": "ok",
  "timestamp": "2025-10-06T...",
  "uptime": 123.45,
  "environment": "production"
}
```

**✅ Se retornar isso, está funcionando!**

### 3.3 Testar Login

```bash
curl -X POST https://neurogame-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}'
```

**✅ Se retornar token JWT, está tudo OK!**

---

## 🔄 Atualizações Automáticas

A partir de agora, **toda vez que você fizer push no GitHub:**

1. Render detecta automaticamente
2. Faz novo build
3. Faz deploy automaticamente
4. Zero downtime!

```bash
# No seu computador
cd neurogame-backend
# ... faça alterações ...
git add .
git commit -m "feat: alguma melhoria"
git push

# Render faz deploy automaticamente em ~3-5 minutos!
```

---

## 🔒 Configurar Domínio Personalizado (Opcional)

Se você tem um domínio próprio:

1. **No Render, vá em Settings** do seu serviço
2. **Clique em "Custom Domain"**
3. **Clique em "Add Custom Domain"**
4. **Digite:** `api.neurogame.com.br`
5. **Configure DNS** no seu provedor de domínio:
   - Tipo: `CNAME`
   - Nome: `api`
   - Valor: `neurogame-backend.onrender.com`
6. **Aguarde propagação** (5-30 minutos)
7. **Render gera SSL** automaticamente!

---

## 📊 Monitoramento

### Ver Logs

1. **No dashboard do serviço**
2. **Aba "Logs"**
3. **Veja logs em tempo real**
4. **Filtre por tipo:** Info, Warning, Error

### Métricas

1. **Aba "Metrics"**
2. **Veja:**
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Eventos

1. **Aba "Events"**
2. **Histórico de:**
   - Deploys
   - Restarts
   - Erros

---

## 🐛 Troubleshooting (Solução de Problemas)

### ❌ Deploy Failed - "Build failed"

**Causa:** Erro ao instalar dependências ou compilar

**Solução:**
1. Verifique logs de build
2. Certifique-se que `package.json` está correto
3. Verifique se Root Directory é `neurogame-backend`
4. Teste localmente: `npm install && npm start`

### ❌ Application Error - "Cannot connect to Supabase"

**Causa:** Variáveis de ambiente incorretas

**Solução:**
1. Vá em **Environment** → Edite variáveis
2. Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
3. Certifique-se que são do mesmo projeto
4. Clique em "Save Changes"
5. Render fará redeploy automaticamente

### ❌ CORS Error no Admin

**Causa:** URL do admin não está em `CORS_ORIGIN`

**Solução:**
1. Vá em **Environment**
2. Edite `CORS_ORIGIN` e `ALLOWED_ORIGINS`
3. Adicione a URL do seu admin da Vercel
4. Formato: `https://seu-admin.vercel.app`
5. Salve e aguarde redeploy

### ❌ Service Unavailable (503)

**Causa:** Serviço pode estar inicializando

**Solução:**
1. No plano Free, o serviço "hiberna" após 15 min sem uso
2. Primeira requisição pode demorar 30-60 segundos
3. Após "acordar", funciona normalmente
4. Para evitar: Upgrade para plano pago ($7/mês)

### ❌ "Cannot GET /"

**Causa:** Normal! O backend é API-only

**Solução:** Acesse `/api/v1/health` ao invés de `/`

---

## 💰 Custos e Limites

### Plano Free

✅ **Incluído:**
- 750 horas/mês (suficiente para 1 serviço 24/7)
- 512MB RAM
- Shared CPU
- 100GB bandwidth/mês
- SSL automático
- **$0/mês** 🎉

⚠️ **Limitações:**
- Serviço "hiberna" após 15 min sem requisições
- Primeira requisição após hibernar demora ~30-60s
- Restarts diários

### Plano Starter ($7/mês)

✅ **Vantagens:**
- Sem hibernação
- 512MB RAM garantidos
- Builds mais rápidos
- Sem restarts diários

### Uso Estimado

Para NeuroGame com poucos usuários:
- **Plano Free:** Suficiente para começar
- **Upgrade para Starter:** Quando tiver >20 usuários ativos

---

## 🔐 Segurança

### Boas Práticas

✅ **SIM:**
- Use variáveis de ambiente no Render
- Gere chaves JWT fortes (256 bits)
- Use HTTPS (Render faz automaticamente)
- Configure CORS corretamente
- Ative "Auto-Deploy" apenas da branch master

❌ **NÃO:**
- Não commite arquivo `.env` com valores reais
- Não exponha `SUPABASE_SERVICE_KEY` publicamente
- Não use senhas fracas para JWT
- Não desabilite Health Checks

### Backups

- ✅ Supabase faz backup automático do banco
- ✅ GitHub é seu backup de código
- ✅ Render mantém histórico de deploys

---

## 📋 Checklist Pós-Deploy

Após deploy bem-sucedido:

- [ ] Backend está online (status "Live")
- [ ] URL pública gerada
- [ ] `/api/v1/health` responde OK
- [ ] Login funciona (teste com curl)
- [ ] Todas variáveis configuradas
- [ ] CORS configurado com URL do admin
- [ ] URL copiada para usar no Admin (Vercel)
- [ ] Logs verificados (sem erros)

---

## 🔗 Conectar com Admin Panel

Após backend deployado, **atualize o Admin Panel:**

1. **Vá no dashboard da Vercel** (seu admin)
2. **Settings → Environment Variables**
3. **Edite `VITE_API_URL`:**
   - De: `http://localhost:3000/api/v1`
   - Para: `https://neurogame-backend.onrender.com/api/v1`
4. **Save** e **Redeploy** o admin na Vercel
5. **Teste** o login no admin!

---

## ⚙️ Configurações Avançadas (Opcional)

### Auto-Deploy

Por padrão, o Render faz deploy automático. Para desabilitar:

1. Settings → Build & Deploy
2. Desmarque "Auto-Deploy"
3. Deploy manual: botão "Manual Deploy"

### Notificações

1. Settings → Notifications
2. Configure notificações de:
   - Deploy success/failure
   - Service down
   - Via: Email, Slack, Discord, Webhook

### Cron Jobs

Para tarefas agendadas:

1. Dashboard → "New +"
2. Selecione "Cron Job"
3. Configure schedule

---

## 🚀 Próximos Passos

1. ✅ **Backend deployado no Render**
2. ✅ **URL pública disponível**
3. ✅ **Atualizar Admin Panel** com nova URL
4. ✅ **Testar fluxo completo** (admin → backend → supabase)
5. ✅ **Configurar domínio customizado** (opcional)
6. ✅ **Atualizar launcher** com URL de produção
7. ✅ **Distribuir instalador** para usuários

---

## 📞 Suporte

**Render:**
- Documentação: https://render.com/docs
- Status: https://status.render.com
- Community: https://community.render.com

**Problemas com o projeto:**
- Verifique logs no Render dashboard
- Teste variáveis de ambiente
- Verifique se Supabase está online
- Teste localmente primeiro

---

## 🎉 Parabéns!

Se você chegou até aqui, seu backend está **em produção** e acessível pela internet!

**URLs importantes para salvar:**

| Serviço | URL |
|---------|-----|
| **Backend API** | https://neurogame-backend.onrender.com |
| **Health Check** | https://neurogame-backend.onrender.com/api/v1/health |
| **Render Dashboard** | https://dashboard.render.com |
| **Supabase Dashboard** | https://app.supabase.com/project/seu-projeto |

---

**Desenvolvido com NeuroGame Platform v1.0.0**
**Backend em produção no Render! 🚀**
