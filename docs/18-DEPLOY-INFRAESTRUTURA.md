# 18 - DEPLOY E INFRAESTRUTURA

## Visão Geral

Este documento detalha a infraestrutura completa do NeuroOne, incluindo ambientes, serviços, deploy e monitoramento. A arquitetura é distribuída em múltiplos serviços especializados.

---

## 1. Arquitetura de Infraestrutura

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────┬─────────────────┬──────────────────────────┘
                 │                 │
         ┌───────▼────────┐ ┌─────▼────────────┐
         │   Cloudflare   │ │   GitHub Pages   │
         │      CDN       │ │   (Docs)         │
         └───────┬────────┘ └──────────────────┘
                 │
         ┌───────▼────────┐
         │  Vercel/Netlify│
         │   (Frontend)   │
         │  React + Vite  │
         └───────┬────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
┌────▼─────┐       ┌────────▼─────────┐
│ Railway/ │       │    Supabase      │
│  Render  │◄──────┤   PostgreSQL     │
│ Node.js  │       │   + Auth         │
│ Backend  │       │   + Storage      │
└────┬─────┘       └──────────────────┘
     │
     │ WebSocket
     ▼
┌─────────────────────────────┐
│   SSH Linux Server          │
│   (servidor_headless-V4.py) │
│   - Python WebSocket        │
│   - CSV Auto-save           │
│   - biosync-atualizado/     │
└─────────────────────────────┘
```

---

## 2. Ambientes

### 2.1 Desenvolvimento (Local)

**Frontend**:
```bash
# Porta: 5173
npm run dev
```

**Backend Node.js**:
```bash
# Porta: 3000
npm run dev
```

**Servidor Python**:
```bash
# Porta: 8080
python server_headless-V4.py
```

**Banco de Dados**:
- Supabase: Instância de desenvolvimento
- URL: https://seu-projeto.supabase.co

### 2.2 Staging (Homologação)

**Finalidade**: Testes antes de produção

**Domínios**:
- Frontend: `https://staging.neuroone.app`
- Backend: `https://api-staging.neuroone.app`
- Python: `wss://eeg-staging.neuroone.app:8080`

**Banco de Dados**: Supabase (projeto separado de staging)

### 2.3 Produção

**Domínios**:
- Frontend: `https://neuroone.app` e `https://www.neuroone.app`
- Backend: `https://api.neuroone.app`
- Python: `wss://eeg.neuroone.app:8080`

**Banco de Dados**: Supabase (projeto de produção)

---

## 3. Deploy do Frontend (React + Vite)

### 3.1 Opção A: Vercel (Recomendado)

**Configuração**:

**Arquivo**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

**Variáveis de Ambiente na Vercel**:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_API_URL=https://api.neuroone.app
VITE_WS_URL=wss://api.neuroone.app
VITE_PYTHON_WS_URL=wss://eeg.neuroone.app:8080
```

**Deploy**:
```bash
# Via CLI
npm i -g vercel
vercel --prod

# Ou conectar repositório GitHub (deploy automático)
```

### 3.2 Opção B: Netlify

**Arquivo**: `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

**Deploy**:
```bash
# Via CLI
npm i -g netlify-cli
netlify deploy --prod

# Ou conectar repositório GitHub
```

---

## 4. Deploy do Backend Node.js

### 4.1 Opção A: Railway (Recomendado)

**Configuração**:

**Arquivo**: `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Dockerfile** (opcional, para controle total):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Variáveis de Ambiente na Railway**:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[senha]@db.seu-projeto.supabase.co:5432/postgres
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-chave-service
JWT_SECRET=seu-segredo-super-secreto-de-256-bits
JWT_REFRESH_SECRET=outro-segredo-super-secreto
CORS_ORIGIN=https://neuroone.app,https://www.neuroone.app
PYTHON_WS_URL=wss://eeg.neuroone.app:8080
```

**Deploy**:
```bash
# Via CLI
npm i -g @railway/cli
railway login
railway link
railway up

# Ou conectar repositório GitHub (deploy automático)
```

### 4.2 Opção B: Render

**Arquivo**: `render.yaml`
```yaml
services:
  - type: web
    name: neuroone-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
```

**Deploy**:
```bash
# Conectar repositório GitHub no painel da Render
# Deploy automático em cada push
```

---

## 5. Deploy do Servidor Python EEG

### 5.1 Preparação do Servidor SSH Linux

**Requisitos**:
- Ubuntu 20.04+ ou Debian 11+
- Python 3.9+
- Acesso SSH com chave pública
- Porta 8080 aberta no firewall

**Instalação de Dependências**:
```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python e pip
sudo apt install python3 python3-pip python3-venv -y

# Instalar dependências do sistema
sudo apt install build-essential libssl-dev libffi-dev -y
```

### 5.2 Deploy do servidor_headless-V4.py

**Estrutura de Diretórios**:
```bash
/opt/neuroone/
├── server_headless-V4.py
├── requirements.txt
├── venv/
├── logs/
└── data/
    └── csv/
```

**Script de Deploy**:
```bash
#!/bin/bash
# deploy-python-server.sh

set -e

echo "📦 Deploy do Servidor Python EEG"

# Criar diretórios
sudo mkdir -p /opt/neuroone/{logs,data/csv}
sudo chown -R $USER:$USER /opt/neuroone

# Copiar arquivos
scp server_headless-V4.py usuario@servidor:/opt/neuroone/
scp requirements.txt usuario@servidor:/opt/neuroone/

# Conectar ao servidor
ssh usuario@servidor << 'ENDSSH'
cd /opt/neuroone

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar serviço systemd
sudo tee /etc/systemd/system/neuroone-eeg.service > /dev/null <<EOF
[Unit]
Description=NeuroOne EEG WebSocket Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/neuroone
ExecStart=/opt/neuroone/venv/bin/python server_headless-V4.py
Restart=always
RestartSec=10
StandardOutput=append:/opt/neuroone/logs/server.log
StandardError=append:/opt/neuroone/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Habilitar e iniciar serviço
sudo systemctl daemon-reload
sudo systemctl enable neuroone-eeg
sudo systemctl restart neuroone-eeg

echo "✅ Deploy concluído!"
ENDSSH
```

**Executar Deploy**:
```bash
chmod +x deploy-python-server.sh
./deploy-python-server.sh
```

**Verificar Status**:
```bash
ssh usuario@servidor "sudo systemctl status neuroone-eeg"
```

**Ver Logs**:
```bash
ssh usuario@servidor "tail -f /opt/neuroone/logs/server.log"
```

### 5.3 Configuração de SSL para WebSocket (wss://)

**Usando Nginx como Reverse Proxy**:

```bash
# Instalar Nginx e Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configurar Nginx
sudo tee /etc/nginx/sites-available/neuroone-eeg > /dev/null <<EOF
server {
    listen 80;
    server_name eeg.neuroone.app;

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name eeg.neuroone.app;

    # Certificados SSL (serão criados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/eeg.neuroone.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eeg.neuroone.app/privkey.pem;

    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # WebSocket Proxy
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/neuroone-eeg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obter certificado SSL
sudo certbot --nginx -d eeg.neuroone.app
```

**Renovação Automática de SSL**:
```bash
# Certbot já configura renovação automática via cron
# Verificar:
sudo certbot renew --dry-run
```

---

## 6. Banco de Dados Supabase

### 6.1 Configuração de Projeto

**Criar Projeto**:
1. Acessar https://supabase.com
2. New Project
3. Nome: `neuroone-production`
4. Região: `South America (São Paulo)` ou mais próxima
5. Senha forte para PostgreSQL

**Configurações Importantes**:
- **Database Pooling**: Ativar (Transaction mode)
- **Auto-pause**: Desativar (projeto pago)
- **Point-in-time Recovery**: Ativar para backups

### 6.2 Migrações

**Estrutura**:
```
backend/
└── supabase/
    └── migrations/
        ├── 20240101000000_initial_schema.sql
        ├── 20240102000000_add_rls_policies.sql
        └── 20240103000000_add_indexes.sql
```

**Executar Migrações**:
```bash
# Via CLI Supabase
npx supabase db push

# Ou manualmente no SQL Editor
```

### 6.3 Backup e Recuperação

**Backup Automático**:
- Supabase Free: Backups diários (retenção 7 dias)
- Supabase Pro: Backups diários (retenção 30 dias) + PITR

**Backup Manual**:
```bash
# Exportar dump completo
pg_dump -h db.seu-projeto.supabase.co -U postgres -d postgres > backup.sql

# Restaurar
psql -h db.seu-projeto.supabase.co -U postgres -d postgres < backup.sql
```

---

## 7. Domínio e DNS

### 7.1 Configuração de Domínio

**Registrar Domínio**:
- Registro.br (Brasil)
- Namecheap, GoDaddy, etc.

**Configurar DNS** (exemplo com Cloudflare):

**Registros DNS**:
```
Type    Name              Content                        Proxy
----    ----              -------                        -----
A       neuroone.app      [IP Vercel ou CNAME]           ✅ Proxied
CNAME   www               neuroone.app                   ✅ Proxied
CNAME   api               seu-projeto.railway.app        🔶 DNS only
CNAME   eeg               seu-servidor-vps.com           🔶 DNS only
```

**SSL/TLS**:
- Cloudflare: Modo "Full (strict)"
- Vercel/Railway: SSL automático
- Servidor Python: Let's Encrypt via Certbot

---

## 8. CI/CD com GitHub Actions

### 8.1 Frontend (Vercel)

**Arquivo**: `.github/workflows/deploy-frontend.yml`
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod'
```

### 8.2 Backend (Railway)

**Arquivo**: `.github/workflows/deploy-backend.yml`
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run tests
        working-directory: backend
        run: npm test

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: neuroone-backend
```

### 8.3 Servidor Python

**Arquivo**: `.github/workflows/deploy-python.yml`
```yaml
name: Deploy Python Server

on:
  push:
    branches: [main]
    paths:
      - 'biosync-atualizado/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/neuroone
            git pull origin main
            source venv/bin/activate
            pip install -r requirements.txt
            sudo systemctl restart neuroone-eeg
```

---

## 9. Monitoramento e Logs

### 9.1 Uptime Monitoring

**Opção A: UptimeRobot** (Grátis)
```
Endpoints a monitorar:
- https://neuroone.app (Frontend)
- https://api.neuroone.app/health (Backend)
- wss://eeg.neuroone.app (Python WebSocket)

Intervalo: 5 minutos
Alertas: Email, SMS, Slack
```

**Opção B: Better Uptime**
- Mais avançado
- Status page pública
- Incident management

### 9.2 Application Monitoring

**Sentry** (Recomendado):

**Frontend**:
```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://sua-dsn@sentry.io/projeto",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Backend**:
```javascript
// server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://sua-dsn@sentry.io/projeto",
  tracesSampleRate: 0.1,
});

// Middleware de erro
app.use(Sentry.Handlers.errorHandler());
```

### 9.3 Logs Centralizados

**Opção A: Logtail** (Simples):
```javascript
const { Logtail } = require("@logtail/node");
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

logtail.info("Sessão iniciada", { sessionId, teacherId });
```

**Opção B: Better Stack Logs** (Completo)

### 9.4 Analytics

**Plausible Analytics** (Privacy-first):
```html
<!-- frontend/index.html -->
<script defer data-domain="neuroone.app" src="https://plausible.io/js/script.js"></script>
```

---

## 10. Segredos e Variáveis de Ambiente

### 10.1 Gerenciamento Local

**Arquivo**: `.env.example` (commitado no Git)
```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Backend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Python WebSocket
VITE_PYTHON_WS_URL=ws://localhost:8080
```

**Arquivo**: `.env` (NÃO commitado, em .gitignore)
```env
# Valores reais para desenvolvimento local
```

### 10.2 Gerenciamento em Produção

**GitHub Secrets**:
```
Settings > Secrets and variables > Actions > New repository secret

Secrets necessários:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- RAILWAY_TOKEN
- SSH_HOST
- SSH_USER
- SSH_PRIVATE_KEY
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
```

---

## 11. Checklist de Deploy

### Pré-Deploy
- [ ] Testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] SSL configurado
- [ ] Domínio configurado
- [ ] Backups testados

### Deploy
- [ ] Frontend deployado
- [ ] Backend deployado
- [ ] Servidor Python deployado
- [ ] Verificar health checks
- [ ] Testar autenticação
- [ ] Testar WebSocket
- [ ] Testar conexão Bluetooth (PWA)

### Pós-Deploy
- [ ] Monitoramento configurado
- [ ] Logs funcionando
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

## 12. Custos Estimados (Mensal)

**Tier Inicial (até 100 alunos)**:
- Vercel Pro: $20
- Railway Hobby: $5 + uso
- Supabase Pro: $25
- VPS Python (2GB RAM): $10-15
- Domínio: $2-5/mês
- **Total**: ~$60-70/mês

**Tier Crescimento (até 500 alunos)**:
- Vercel Pro: $20
- Railway Pro: $20 + uso
- Supabase Pro: $25
- VPS Python (4GB RAM): $20-30
- **Total**: ~$85-95/mês

**Tier Empresarial (1000+ alunos)**:
- Consultar planos Enterprise

---

## Próxima Etapa

Após deploy completo, criar:
- **Glossário** (doc 23-GLOSSARIO.md): Termos técnicos e definições
