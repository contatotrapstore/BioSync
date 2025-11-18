# ⚡ QUICK START - NeuroOne Platform

> **Objetivo**: Colocar a plataforma no ar em menos de 30 minutos

## 📋 PRÉ-REQUISITOS (5 minutos)

### Ferramentas necessárias:
- [x] Node.js 18+ ([download](https://nodejs.org/))
- [x] Git ([download](https://git-scm.com/))
- [x] Conta Supabase ([criar grátis](https://supabase.com))
- [x] Conta Vercel ([criar grátis](https://vercel.com))
- [x] Conta Render/Railway ([criar grátis](https://render.com))

### Verificar instalação:
```bash
node --version  # deve retornar v18.0.0 ou superior
npm --version   # deve retornar 9.0.0 ou superior
git --version   # deve retornar 2.0.0 ou superior
```

---

## 🚀 SETUP RÁPIDO (3 PASSOS)

### **PASSO 1: Configurar Supabase** (10 minutos)

#### 1.1. Criar projeto:
1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Escolha nome: `neuroone-production`
4. Região: South America (São Paulo) ou mais próxima
5. Aguarde ~2 minutos para provisionar

#### 1.2. Executar migrations:
1. Vá em **SQL Editor** no menu lateral
2. Execute as 5 migrations na ordem:
   - `supabase/migrations/01_initial_schema.sql`
   - `supabase/migrations/02_sessions.sql`
   - `supabase/migrations/03_eeg_data.sql`
   - `supabase/migrations/04_rls_policies.sql`
   - `supabase/migrations/05_functions.sql`

#### 1.3. Copiar credenciais:
1. Vá em **Settings → API**
2. Copie 3 valores:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key (JWT longo)
   - `service_role` `secret` key (JWT longo)

---

### **PASSO 2: Configurar variáveis de ambiente** (5 minutos)

#### 2.1. Executar script automático:
```bash
cd "c:\Users\GouveiaRx\Downloads\BioSync Game FN"
deployment\setup-env-vars.bat
```

#### 2.2. Editar arquivos gerados:

**Frontend** (`neuroone-frontend\.env.local`):
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co  # ← Cole aqui
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...               # ← Cole aqui
VITE_API_URL=https://neuroone-backend.onrender.com  # ← Ajustar depois
VITE_WS_URL=wss://neuroone-backend.onrender.com     # ← Ajustar depois
VITE_ENV=production
```

**Backend** (`neuroone-backend\.env`):
```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co       # ← Cole aqui
SUPABASE_ANON_KEY=eyJhbGciOi...                    # ← Cole aqui
SUPABASE_SERVICE_KEY=eyJhbGciOi...                 # ← Cole aqui
PORT=3001
NODE_ENV=production
JWT_SECRET=sua_jwt_secret_gerada_aqui              # ← Cole do jwt-secret-temp.txt
WS_CORS_ORIGIN=https://neuroone.jogosadm.com.br    # ← Ajustar depois
```

#### 2.3. Limpar arquivo temporário:
```bash
del neuroone-backend\jwt-secret-temp.txt
```

---

### **PASSO 3: Deploy na nuvem** (15 minutos)

#### 3.1. Deploy do Backend (Render):
1. Acesse [https://dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `neuroone-backend`
   - **Root Directory**: `neuroone-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free
5. Vá em **"Environment"** e adicione as variáveis do `.env`:
   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_KEY=...
   JWT_SECRET=...
   PORT=3001
   NODE_ENV=production
   WS_CORS_ORIGIN=https://neuroone.jogosadm.com.br
   ```
6. Clique em **"Create Web Service"**
7. Aguarde ~5 minutos
8. Copie a URL gerada (ex: `https://neuroone-backend.onrender.com`)

#### 3.2. Atualizar frontend com URL do backend:
Edite `neuroone-frontend\.env.local`:
```env
VITE_API_URL=https://neuroone-backend.onrender.com  # ← URL copiada acima
VITE_WS_URL=wss://neuroone-backend.onrender.com     # ← Mesma URL, mas wss://
```

#### 3.3. Deploy do Frontend (Vercel):
1. Acesse [https://vercel.com/new](https://vercel.com/new)
2. Conecte seu repositório GitHub
3. Configure:
   - **Project Name**: `neuroone`
   - **Framework Preset**: Vite
   - **Root Directory**: `neuroone-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Vá em **"Environment Variables"** e adicione:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   VITE_API_URL=https://neuroone-backend.onrender.com
   VITE_WS_URL=wss://neuroone-backend.onrender.com
   VITE_ENV=production
   ```
5. Clique em **"Deploy"**
6. Aguarde ~3 minutos
7. Copie a URL gerada (ex: `https://neuroone.vercel.app`)

#### 3.4. Atualizar CORS no backend:
No Render, vá em **Environment** e atualize:
```env
WS_CORS_ORIGIN=https://neuroone.vercel.app  # ← URL do Vercel
```
Clique em **"Save Changes"** (redeploy automático)

---

## ✅ VERIFICAÇÃO FINAL (5 minutos)

### Checklist:
- [ ] Backend responde em `https://neuroone-backend.onrender.com/health`
- [ ] Frontend abre em `https://neuroone.vercel.app`
- [ ] Login funciona com usuário admin
- [ ] WebSocket conecta (console do navegador não mostra erros)

### Criar usuário admin inicial:
```bash
# No SQL Editor do Supabase
INSERT INTO users (email, password_hash, role, name)
VALUES (
  'admin@neurogame.com',
  crypt('Admin123', gen_salt('bf')),
  'direction',
  'Administrador'
);
```

---

## 🧪 TESTE LOCAL (OPCIONAL)

### Rodar em desenvolvimento:

**Terminal 1 - Backend**:
```bash
cd neuroone-backend
npm install
npm run dev
# Rodando em http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
cd neuroone-frontend
npm install
npm run dev
# Rodando em http://localhost:5173
```

**Terminal 3 - EEG Server**:
```bash
cd neuroone-backend/eeg-server
node eeg-server.js
# Rodando em ws://localhost:8080
```

### Testar conexão:
1. Abra `http://localhost:5173`
2. Login: `admin@neurogame.com` / `Admin123`
3. Navegue pelas telas
4. Verifique console do navegador (F12) para erros

---

## 🛠️ TROUBLESHOOTING

### Problema: "Failed to fetch" no frontend
**Causa**: Backend não está respondendo ou CORS mal configurado
**Solução**:
1. Verifique se backend está online: `curl https://neuroone-backend.onrender.com/health`
2. Verifique `WS_CORS_ORIGIN` no Render
3. Verifique se `VITE_API_URL` no Vercel está correto

### Problema: "JWT malformed" ou "Invalid token"
**Causa**: JWT_SECRET diferente entre frontend e backend
**Solução**:
1. Verifique `JWT_SECRET` no Render (backend)
2. Regenere token: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Atualize em Render e Vercel
4. Redeploy ambos

### Problema: "supabase is not defined"
**Causa**: Variáveis VITE_SUPABASE_* não configuradas
**Solução**:
1. Verifique no Vercel → Settings → Environment Variables
2. Certifique-se que começam com `VITE_`
3. Redeploy

### Problema: WebSocket não conecta
**Causa**: CORS ou URL wss:// incorreta
**Solução**:
1. Verifique `VITE_WS_URL` usa `wss://` (não `ws://`)
2. Verifique `WS_CORS_ORIGIN` no backend
3. Abra console do navegador (F12) → Network → WS para ver erro

### Problema: Build do Vercel falha
**Causa**: Dependências faltando ou erro de tipo
**Solução**:
1. Verifique logs no Vercel
2. Rode localmente: `cd neuroone-frontend && npm run build`
3. Corrija erros TypeScript/ESLint
4. Commit e push novamente

---

## 📚 PRÓXIMOS PASSOS

### Depois do deploy:
1. **Configurar domínio customizado** (opcional):
   - No Vercel: Settings → Domains
   - Adicione `neuroone.jogosadm.com.br`
   - Configure DNS: CNAME → `cname.vercel-dns.com`

2. **Ler documentação completa**:
   - [GUIA-NOVOS-COMPONENTES.md](GUIA-NOVOS-COMPONENTES.md) - Componentes v2.5.0
   - [STATUS-FINAL-COMPLETO.md](STATUS-FINAL-COMPLETO.md) - Status geral do projeto
   - [PROGRESSO-DESIGN-SESSAO2.md](PROGRESSO-DESIGN-SESSAO2.md) - Mudanças de design

3. **Testar todas as funcionalidades**:
   - Criar psicólogo, professor, aluno
   - Criar turma e adicionar alunos
   - Iniciar sessão com EEG mock
   - Gerar relatório
   - Testar em mobile

4. **Configurar monitoramento** (recomendado):
   - Sentry para erros: [https://sentry.io](https://sentry.io)
   - Google Analytics: Adicione `VITE_GA_ID` no Vercel
   - Uptime monitoring: [https://uptimerobot.com](https://uptimerobot.com)

---

## 🎮 LAUNCHER PC (EXTRA)

O launcher PC já está pronto em `launcher-pc-neurogame/`:

### Build do launcher:
```bash
cd launcher-pc-neurogame
npm install
npm run build:electron:win
# Executável gerado em: dist/NeuroOne-Setup-1.0.0.exe
```

### Distribuir:
1. Copie o `.exe` para Google Drive, Dropbox ou GitHub Releases
2. Envie link para usuários Windows
3. Launcher abrirá automaticamente o webapp no navegador

---

## 📞 SUPORTE

- **Documentação**: Veja arquivos `.md` na raiz do projeto
- **Issues**: Abra issue no GitHub do projeto
- **Email**: suporte@neurogame.com (configurar)

---

**Versão**: v2.5.0
**Última atualização**: 18/11/2025
**Status**: ✅ Produção Ready (95% completo)
