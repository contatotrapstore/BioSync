# 🚀 Guia de Deploy em Produção - NeuroGame Platform

## 📋 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    AMBIENTE DE PRODUÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   BACKEND    │◄────►│     ADMIN    │      │  LAUNCHER │ │
│  │              │      │              │      │           │ │
│  │ Node.js API  │      │  React App   │      │  Desktop  │ │
│  │              │      │              │      │   (Users) │ │
│  └──────┬───────┘      └──────────────┘      └───────────┘ │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │   SUPABASE   │                                           │
│  │  PostgreSQL  │                                           │
│  └──────────────┘                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 O Que Precisa Ir Para o Servidor

### ✅ BACKEND (API) - **OBRIGATÓRIO NO SERVIDOR**
- **Pasta:** `neurogame-backend/`
- **Tecnologia:** Node.js + Express
- **Função:** Servir API REST para Admin e Launcher
- **Porta:** 3000 (configurável)

### ✅ ADMIN PANEL - **OBRIGATÓRIO NO SERVIDOR**
- **Pasta:** `neurogame-admin/`
- **Tecnologia:** React (build estático)
- **Função:** Interface web de administração
- **Hospedagem:** Pode ser Vercel, Netlify, ou servidor próprio

### ❌ LAUNCHER - **NÃO VAI PARA O SERVIDOR**
- **Pasta:** `neurogame-launcher/`
- **Tecnologia:** Electron (Desktop App)
- **Distribuição:** Instalador (.exe) para usuários finais
- **Local:** Pasta `INSTALADORES/` (já gerado)

---

## 📦 Estrutura de Deploy

### 1️⃣ Backend (Servidor Node.js)

#### Opções de Hospedagem:
- **VPS** (recomendado): DigitalOcean, Linode, AWS EC2, Azure VM
- **PaaS**: Heroku, Railway, Render
- **Dedicado**: Servidor próprio

#### Arquivos Necessários:
```
neurogame-backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── server.js
├── package.json
├── .env (criar em produção)
└── node_modules/ (instalar no servidor)
```

#### Variáveis de Ambiente (.env):
```env
# Servidor
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# JWT
JWT_SECRET=sua-chave-secreta-super-forte-256-bits
JWT_REFRESH_SECRET=outra-chave-secreta-diferente

# ASAAS (Pagamentos)
ASAAS_API_KEY=sua-chave-asaas
ASAAS_WEBHOOK_SECRET=seu-webhook-secret

# CORS
ALLOWED_ORIGINS=https://admin.neurogame.com.br,https://neurogame.com.br

# URLs
FRONTEND_URL=https://admin.neurogame.com.br
```

#### Comandos de Deploy:
```bash
# No servidor
cd neurogame-backend
npm install --production
npm start

# Ou com PM2 (recomendado)
npm install -g pm2
pm2 start src/server.js --name neurogame-api
pm2 save
pm2 startup
```

---

### 2️⃣ Admin Panel (Frontend React)

#### Opções de Hospedagem:

##### Opção A: Vercel (Recomendado - Grátis)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Na pasta neurogame-admin
cd neurogame-admin
vercel

# Configurar variáveis de ambiente no dashboard:
VITE_API_URL=https://api.neurogame.com.br
```

##### Opção B: Netlify (Grátis)
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Build e deploy
cd neurogame-admin
npm run build
netlify deploy --prod
```

##### Opção C: Servidor Próprio (Nginx)
```bash
# Build local
cd neurogame-admin
npm run build

# Upload da pasta dist/ para o servidor
scp -r dist/* user@servidor:/var/www/admin-neurogame/

# Configurar Nginx
server {
    listen 80;
    server_name admin.neurogame.com.br;

    root /var/www/admin-neurogame;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Variáveis de Ambiente (Build):
Criar arquivo `.env.production` em `neurogame-admin/`:
```env
VITE_API_URL=https://api.neurogame.com.br
```

---

### 3️⃣ Launcher (Distribuição para Usuários)

#### ✅ Já Está Pronto!
- **Local:** `INSTALADORES/NeuroGame Launcher Setup 1.0.0.exe`
- **Tamanho:** 82MB
- **O que fazer:** Disponibilizar para download no site

#### Opções de Distribuição:

##### Opção A: Download Direto no Site
```html
<!-- No site neurogame.com.br -->
<a href="/downloads/NeuroGame-Launcher-Setup-1.0.0.exe" download>
  Baixar NeuroGame Launcher (82MB)
</a>
```

##### Opção B: Sistema de Auto-Atualização (Recomendado)
Hospedar os arquivos da pasta `INSTALADORES/` no backend:

```bash
# No servidor backend, criar pasta releases
mkdir -p /var/www/neurogame-releases

# Upload dos arquivos
scp INSTALADORES/* user@servidor:/var/www/neurogame-releases/

# Estrutura:
/var/www/neurogame-releases/
├── NeuroGame Launcher Setup 1.0.0.exe
└── latest.yml
```

O backend já tem as rotas configuradas:
- `GET /api/v1/downloads/` - Lista releases
- `GET /api/v1/downloads/latest.yml` - Metadata para updates
- `GET /api/v1/downloads/:filename` - Download de arquivos

---

## 🔧 Checklist de Deploy Completo

### Backend (API Server)

- [ ] **1. Preparar Servidor**
  - [ ] Contratar VPS/Cloud (mínimo 1GB RAM, 20GB SSD)
  - [ ] Instalar Node.js 18+ e npm
  - [ ] Instalar PM2: `npm install -g pm2`
  - [ ] Configurar firewall (abrir porta 3000 ou usar Nginx)

- [ ] **2. Configurar Domínio**
  - [ ] Registrar domínio (ex: api.neurogame.com.br)
  - [ ] Configurar DNS A Record apontando para IP do servidor
  - [ ] Instalar certificado SSL (Let's Encrypt + Certbot)

- [ ] **3. Deploy do Código**
  ```bash
  # Clone ou upload do código
  git clone seu-repo.git
  cd neurogame-backend

  # Instalar dependências
  npm install --production

  # Criar arquivo .env com dados de produção
  nano .env

  # Testar
  npm start

  # Iniciar com PM2
  pm2 start src/server.js --name neurogame-api
  pm2 save
  pm2 startup
  ```

- [ ] **4. Configurar Nginx (Proxy Reverso)**
  ```nginx
  server {
      listen 80;
      server_name api.neurogame.com.br;

      location / {
          proxy_pass http://localhost:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```

- [ ] **5. Configurar SSL**
  ```bash
  sudo certbot --nginx -d api.neurogame.com.br
  ```

- [ ] **6. Testar API**
  ```bash
  curl https://api.neurogame.com.br/api/v1/health
  ```

---

### Admin Panel (Frontend)

- [ ] **1. Escolher Plataforma**
  - [ ] Opção A: Vercel (recomendado)
  - [ ] Opção B: Netlify
  - [ ] Opção C: Servidor próprio com Nginx

- [ ] **2. Configurar Variáveis de Ambiente**
  ```env
  VITE_API_URL=https://api.neurogame.com.br
  ```

- [ ] **3. Deploy**

  **Se Vercel:**
  ```bash
  cd neurogame-admin
  vercel --prod
  ```

  **Se servidor próprio:**
  ```bash
  # Local
  cd neurogame-admin
  npm run build

  # Upload
  scp -r dist/* user@servidor:/var/www/admin/
  ```

- [ ] **4. Configurar Domínio**
  - [ ] Configurar DNS (ex: admin.neurogame.com.br)
  - [ ] Configurar SSL

- [ ] **5. Testar Admin**
  - [ ] Acessar https://admin.neurogame.com.br
  - [ ] Fazer login com credenciais admin
  - [ ] Verificar todas as funcionalidades

---

### Launcher (Distribuição)

- [ ] **1. Hospedar Instalador**
  - [ ] Upload para servidor de releases
  - [ ] Ou usar CDN (Cloudflare, AWS S3)

- [ ] **2. Criar Página de Download**
  ```html
  <!-- site principal -->
  <a href="/downloads/NeuroGame-Launcher-Setup-1.0.0.exe">
    Baixar NeuroGame Launcher
  </a>
  ```

- [ ] **3. Configurar Auto-Update**
  - [ ] Garantir que latest.yml está acessível
  - [ ] Testar URL: https://api.neurogame.com.br/api/v1/downloads/latest.yml

- [ ] **4. Distribuir aos Usuários**
  - [ ] Divulgar link de download
  - [ ] Fornecer instruções (usar LEIA-ME.txt)

---

## 🌐 Configuração de DNS Sugerida

```
Tipo    Nome       Valor                     TTL
A       @          IP_DO_SERVIDOR            3600
CNAME   api        @                         3600
CNAME   admin      vercel-deployment.com     3600  (se usar Vercel)
CNAME   www        @                         3600
```

---

## 📊 Monitoramento

### Logs do Backend (PM2)
```bash
# Ver logs em tempo real
pm2 logs neurogame-api

# Ver status
pm2 status

# Reiniciar se necessário
pm2 restart neurogame-api
```

### Métricas
```bash
# Monitorar CPU/Memória
pm2 monit

# Dashboard web
pm2 web
```

---

## 🔒 Segurança

### Backend
- [x] HTTPS com SSL/TLS
- [x] CORS configurado
- [x] JWT com secrets fortes
- [x] Rate limiting
- [x] Validação de inputs
- [x] SQL injection protection (via Supabase)

### Admin
- [x] HTTPS obrigatório
- [x] Autenticação JWT
- [x] Proteção de rotas
- [x] CSP headers

### Supabase
- [x] RLS (Row Level Security) habilitado
- [x] Policies configuradas
- [x] API keys seguras

---

## 💰 Custos Estimados (Produção Pequena/Média)

| Serviço | Opção | Custo Mensal |
|---------|-------|--------------|
| **Backend VPS** | DigitalOcean Droplet 1GB | $6/mês |
| **Admin Frontend** | Vercel (grátis até 100GB) | $0 |
| **Supabase** | Free tier (500MB DB) | $0 |
| **Domínio** | .com.br | ~R$ 3-5/mês |
| **SSL** | Let's Encrypt | $0 |
| **CDN Instalador** | Cloudflare (grátis) | $0 |
| **TOTAL** | | **~$6-10/mês** |

---

## 🚦 Status de Prontidão

### ✅ Pronto para Produção
- [x] Backend API completo
- [x] Admin Panel funcional
- [x] Launcher desktop compilado
- [x] Sistema de autenticação
- [x] Sistema de jogos (CRUD)
- [x] Sistema de assinaturas
- [x] Sistema de pagamentos (Asaas)
- [x] Auto-atualização do launcher
- [x] Proteção de jogos (session tokens)

### ⚠️ Recomendações Antes do Deploy
- [ ] Configurar backup automático do Supabase
- [ ] Configurar monitoramento (UptimeRobot, Pingdom)
- [ ] Testar fluxo completo de usuário
- [ ] Preparar documentação de suporte
- [ ] Configurar emails transacionais (SendGrid, Mailgun)

---

## 📞 Próximos Passos

1. **Escolher provedor de hospedagem** para o backend
2. **Registrar domínio** (se ainda não tiver)
3. **Fazer deploy do backend** seguindo o checklist
4. **Fazer deploy do admin** (Vercel recomendado)
5. **Hospedar o instalador** para download
6. **Testar tudo** antes de divulgar
7. **Configurar monitoramento** e backups

---

**Desenvolvido por NeuroGame Team - 2025**
