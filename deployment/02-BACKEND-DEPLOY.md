# Guia de Deploy: Backend Node.js (Railway/Render)

Este guia detalha o processo de deploy do backend NeuroOne (Node.js + Express + Socket.io) em plataformas cloud gratuitas/pagas.

## 🎯 Escolha da Plataforma

| Plataforma | Plano Gratuito | Custo Mensal | Recursos | Recomendação |
|------------|---------------|--------------|----------|--------------|
| **Railway** | $5 crédito/mês | $5-20/mês | 512MB RAM, sleep após inatividade | ⭐ Melhor para começar |
| **Render** | Sim (750h/mês) | $7-25/mês | 512MB RAM, sleep após 15min | ⭐⭐ Bom para produção |
| **Heroku** | Não (pago apenas) | $7-25/mês | 512MB-1GB RAM | Alternativa confiável |

**Recomendação**: Use **Railway** para testes iniciais (fácil setup) ou **Render** para produção (mais estável).

---

## 📦 Opção 1: Deploy no Railway

### Passo 1.1: Criar Conta e Projeto

1. Acesse [https://railway.app](https://railway.app)
2. Clique em **"Start a New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Conecte sua conta GitHub e selecione o repositório `neuroone`

Ou, se preferir deploy manual:
1. Escolha **"Empty Project"**
2. Clique em **"+ New"** > **"Empty Service"**
3. Nomeie: `neuroone-backend`

### Passo 1.2: Configurar Variáveis de Ambiente

1. Clique no serviço `neuroone-backend`
2. Vá na aba **"Variables"**
3. Adicione as seguintes variáveis (clique em **"New Variable"** para cada uma):

```env
# Database (Supabase - obtido no passo anterior)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=3001
NODE_ENV=production

# JWT (gere uma chave aleatória forte)
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres-aleatoria
JWT_EXPIRATION=24h

# WebSocket
WS_PORT=3002
WS_CORS_ORIGIN=*

# LGPD
LGPD_CONSENT_VERSION=1.0.0
DATA_RETENTION_YEARS=5

# Logs
LOG_LEVEL=info
```

⚠️ **IMPORTANTE**: Gere um `JWT_SECRET` forte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 1.3: Configurar Build e Start

Se você está usando deploy via GitHub, Railway detectará automaticamente `package.json`.

Se precisar configurar manualmente:

1. Vá em **"Settings"** do serviço
2. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Watch Paths**: `neuroone-backend/**`

### Passo 1.4: Deploy

1. Clique em **"Deploy"** (ou faça commit no GitHub)
2. Aguarde o build (2-5 minutos)
3. Verifique os logs em **"Deployments"** > **"View Logs"**
4. Após sucesso, anote a URL gerada (ex: `https://neuroone-backend-production.up.railway.app`)

### Passo 1.5: Configurar Domínio Público

1. Vá em **"Settings"** > **"Networking"**
2. Clique em **"Generate Domain"**
3. Ou configure domínio custom: **"Custom Domain"** > adicione `api.seudominio.com`

### Passo 1.6: Testar Deploy

```bash
# Health check
curl https://neuroone-backend-production.up.railway.app/health

# Listar users (deve retornar erro de auth ou lista vazia)
curl https://neuroone-backend-production.up.railway.app/api/users

# WebSocket health (via navegador)
wscat -c wss://neuroone-backend-production.up.railway.app
```

---

## 📦 Opção 2: Deploy no Render

### Passo 2.1: Criar Conta e Serviço

1. Acesse [https://render.com](https://render.com)
2. Faça login/cadastro
3. Clique em **"New +"** > **"Web Service"**
4. Conecte seu repositório GitHub ou escolha **"Public Git repository"**

### Passo 2.2: Configurar Serviço

Preencha os campos:

- **Name**: `neuroone-backend`
- **Region**: `Oregon (US West)` ou mais próximo
- **Branch**: `main` ou `master`
- **Root Directory**: `neuroone-backend` (se projeto está em subpasta)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (para testes) ou `Starter` ($7/mês para produção)

### Passo 2.3: Configurar Variáveis de Ambiente

Na seção **"Environment"**, adicione as variáveis (mesmo formato do Railway acima):

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
NODE_ENV=production
JWT_SECRET=sua-chave-secreta-forte
JWT_EXPIRATION=24h
WS_CORS_ORIGIN=*
LGPD_CONSENT_VERSION=1.0.0
DATA_RETENTION_YEARS=5
LOG_LEVEL=info
```

### Passo 2.4: Configurar Health Check (Importante!)

Render usa health checks para verificar se serviço está rodando:

1. Em **"Health Check Path"**, defina: `/health`
2. Isso evita que o serviço seja marcado como "down"

### Passo 2.5: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde build (3-7 minutos)
3. Acompanhe logs em **"Logs"**
4. Anote URL gerada (ex: `https://neuroone-backend.onrender.com`)

### Passo 2.6: Configurar Domínio Custom (Opcional)

1. Vá em **"Settings"** > **"Custom Domain"**
2. Adicione `api.seudominio.com`
3. Configure DNS CNAME apontando para `neuroone-backend.onrender.com`

### Passo 2.7: Evitar "Cold Starts" (Plano Free)

O plano Free do Render **"dorme" após 15min de inatividade**. Para evitar:

**Opção A**: Upgrade para plano Starter ($7/mês)

**Opção B**: Use um serviço de ping (Cron-job.org, UptimeRobot):
```bash
# Ping a cada 10 minutos
*/10 * * * * curl https://neuroone-backend.onrender.com/health
```

---

## 🛠️ Configurações Adicionais

### Configurar CORS no Backend

Certifique-se que o backend aceita requisições do frontend:

Edite `neuroone-backend/src/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.WS_CORS_ORIGIN || '*', // Em produção, especifique domínio do frontend
  credentials: true
}));
```

Atualize variável de ambiente:
```env
WS_CORS_ORIGIN=https://seu-frontend.vercel.app
```

### Configurar WebSocket CORS

Edite `neuroone-backend/src/websocket/server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.WS_CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### Habilitar Logs Estruturados

Para melhor debugging em produção:

```javascript
// neuroone-backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

---

## ✅ Passo 3: Validação Pós-Deploy

### 3.1 Testar Endpoints da API

```bash
# Substituir URL pela sua
export BACKEND_URL="https://neuroone-backend.onrender.com"

# 1. Health check
curl $BACKEND_URL/health
# Esperado: {"status":"ok","timestamp":"2025-01-17T..."}

# 2. Listar usuários (deve retornar 401 ou lista se auth desabilitado)
curl $BACKEND_URL/api/users

# 3. Login com admin
curl -X POST $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@neurogame.com","password":"SuaNovaSenha"}'
# Esperado: {"success":true,"token":"eyJ...","user":{...}}

# 4. Listar sessões (autenticado)
TOKEN="seu-token-jwt-aqui"
curl $BACKEND_URL/api/sessions \
  -H "Authorization: Bearer $TOKEN"
```

### 3.2 Testar WebSocket

Use ferramenta como [Postman](https://www.postman.com/) ou [wscat](https://www.npmjs.com/package/wscat):

```bash
# Instalar wscat
npm install -g wscat

# Conectar ao WebSocket
wscat -c wss://neuroone-backend.onrender.com

# Deve conectar e receber heartbeat
Connected (press CTRL+C to quit)
< {"type":"ping"}
```

### 3.3 Verificar Logs

**Railway**:
- Dashboard > Deployments > View Logs

**Render**:
- Dashboard > Logs

Procure por:
- ✅ `Server listening on port 3001`
- ✅ `WebSocket server listening on port 3002`
- ✅ `Database connected successfully`
- ❌ Erros de conexão com Supabase
- ❌ Erros de autenticação

### 3.4 Monitorar Performance

**Railway**: Vá em **"Metrics"** para ver CPU/RAM usage

**Render**: Vá em **"Metrics"** para:
- Response time
- Request rate
- Memory usage
- CPU usage

---

## 🔐 Segurança em Produção

### Checklist de Segurança

- [ ] `JWT_SECRET` gerado com 32+ caracteres aleatórios
- [ ] `WS_CORS_ORIGIN` configurado com domínio específico (não `*`)
- [ ] Variáveis de ambiente **não commitadas** no Git (.env no .gitignore)
- [ ] `SUPABASE_SERVICE_KEY` protegido (apenas backend tem acesso)
- [ ] HTTPS habilitado (Railway/Render fazem automaticamente)
- [ ] Rate limiting implementado (opcional):
  ```javascript
  const rateLimit = require('express-rate-limit');
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de requisições
  }));
  ```
- [ ] Helmet.js habilitado (segurança HTTP):
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

### Backup e Disaster Recovery

1. **Banco de Dados**: Backups automáticos no Supabase (configurado no passo anterior)
2. **Código**: GitHub/GitLab como source of truth
3. **Logs**: Railway/Render mantém logs por 7 dias (plano free) ou 30 dias (pago)

---

## 🐛 Troubleshooting

### Problema: "Build failed" com erro de dependências

**Solução**:
```bash
# Limpar node_modules e package-lock.json
rm -rf node_modules package-lock.json
npm install
npm audit fix
```

Faça commit e redeploy.

### Problema: "Database connection refused"

**Causa**: Variáveis `SUPABASE_*` incorretas.

**Solução**:
1. Verifique credenciais no Supabase Dashboard
2. Confirme que `SUPABASE_URL` tem `https://`
3. Teste conexão manualmente:
   ```bash
   curl https://SEU_PROJETO.supabase.co/rest/v1/users \
     -H "apikey: SUA_ANON_KEY"
   ```

### Problema: WebSocket não conecta

**Causa**: Render/Railway não suportam múltiplas portas no plano Free.

**Solução**: WebSocket deve rodar na mesma porta do Express:

Edite `neuroone-backend/src/server.js`:
```javascript
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// ... configurações WebSocket

server.listen(PORT, () => {
  console.log(`Server + WebSocket on port ${PORT}`);
});
```

### Problema: "Service sleeping" (Render Free)

**Solução**: Configure cron job para ping a cada 10 minutos ou faça upgrade para Starter ($7/mês).

---

## 📊 Monitoramento e Observability

### Opção 1: New Relic (Gratuito para pequenos projetos)

1. Cadastre-se em [https://newrelic.com](https://newrelic.com)
2. Obtenha License Key
3. Adicione ao backend:
   ```bash
   npm install newrelic
   ```
4. Configure `newrelic.js` e adicione variável `NEW_RELIC_LICENSE_KEY`

### Opção 2: Sentry (Error Tracking)

1. Cadastre-se em [https://sentry.io](https://sentry.io)
2. Crie projeto Node.js
3. Instale SDK:
   ```bash
   npm install @sentry/node
   ```
4. Configure no `server.js`:
   ```javascript
   const Sentry = require('@sentry/node');
   Sentry.init({ dsn: process.env.SENTRY_DSN });
   ```

---

## 🎯 Próximos Passos

Após concluir o deploy do backend:

1. ✅ Anote a URL do backend (ex: `https://neuroone-backend.onrender.com`)
2. ✅ Teste todos os endpoints críticos
3. ✅ Configure domínio custom (opcional)
4. ➡️ Prossiga para **[03-FRONTEND-DEPLOY.md](03-FRONTEND-DEPLOY.md)** (deploy do frontend no Vercel)

---

**Última atualização**: 2025-01-17
**Versão**: 1.0.0
**Autor**: Claude Code
