# 🔑 Guia de Gerenciamento de Variáveis de Ambiente

**Projeto:** NeuroOne Educacional
**Última Atualização:** 19/11/2025
**Autor:** Equipe NeuroOne

---

## 📋 Sumário

1. [Estrutura de Arquivos](#estrutura-de-arquivos)
2. [Configuração Local](#configuração-local)
3. [Configuração de Produção](#configuração-de-produção)
4. [Secrets Sensíveis](#secrets-sensíveis)
5. [Deploy em Plataformas](#deploy-em-plataformas)
6. [Rotação de Secrets](#rotação-de-secrets)
7. [Checklist de Segurança](#checklist-de-segurança)

---

## 📁 Estrutura de Arquivos

O projeto utiliza arquivos `.env` para configuração em diferentes ambientes:

```
neuroone-backend/
├── .env.example              # ✅ Template para desenvolvimento (commitado)
├── .env.production.example   # ✅ Template para produção (commitado)
├── .env                      # ❌ Suas configurações locais (NÃO commitado)
└── .env.production           # ❌ Configurações de produção (NÃO commitado)

neuroone-frontend/
├── .env.example              # ✅ Template para desenvolvimento (commitado)
├── .env.production.example   # ✅ Template para produção (commitado)
├── .env                      # ❌ Suas configurações locais (NÃO commitado)
└── .env.production           # ❌ Configurações de produção (NÃO commitado)
```

### ⚠️ IMPORTANTE

- Os arquivos `.env` e `.env.production` **NUNCA** devem ser commitados no Git
- Eles já estão listados no `.gitignore`
- Apenas os arquivos `.example` são versionados (com valores placeholder)

---

## 🏠 Configuração Local

### Backend (Desenvolvimento)

1. **Copiar template:**
   ```bash
   cd neuroone-backend
   cp .env.example .env
   ```

2. **Editar valores:**
   ```bash
   # Abrir no editor
   code .env  # VS Code
   # ou
   nano .env  # Terminal
   ```

3. **Preencher credenciais do Supabase:**
   - Acesse: https://app.supabase.com
   - Vá em: Project > Settings > API
   - Copie:
     - `SUPABASE_URL`: Project URL
     - `SUPABASE_ANON_KEY`: anon/public key
     - `SUPABASE_SERVICE_KEY`: service_role key ⚠️ (apenas backend!)

4. **Gerar JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Configurar CORS:**
   ```bash
   CORS_ORIGIN=http://localhost:5173
   WS_CORS_ORIGIN=http://localhost:5173
   ```

### Frontend (Desenvolvimento)

1. **Copiar template:**
   ```bash
   cd neuroone-frontend
   cp .env.example .env
   ```

2. **Configurar URLs locais:**
   ```bash
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3001
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

⚠️ **NUNCA** coloque `SUPABASE_SERVICE_KEY` no frontend!

---

## 🚀 Configuração de Produção

### Backend (.env.production)

**Variáveis críticas que diferem do desenvolvimento:**

```bash
# URLs de produção
CORS_ORIGIN=https://neuroone.jogosadm.com.br
WS_CORS_ORIGIN=https://neuroone.jogosadm.com.br

# Backend URL (Render)
HOST=0.0.0.0
PORT=3001

# Node environment
NODE_ENV=production

# Database - usar Connection Pooler para produção
DATABASE_URL=postgresql://postgres.your-project:password@pooler.your-project.supabase.co:5432/postgres

# Secrets - DEVEM ser diferentes do dev!
JWT_SECRET=<gerar novo secret de 64 caracteres>
SESSION_SECRET=<gerar novo secret de 64 caracteres>
```

### Frontend (.env.production)

```bash
# Backend de produção
VITE_API_URL=https://biosync-jlfh.onrender.com
VITE_WS_URL=wss://biosync-jlfh.onrender.com

# App environment
VITE_APP_ENV=production

# Feature flags
VITE_FEATURE_ANALYTICS=true  # Habilitar em produção
```

---

## 🔐 Secrets Sensíveis

### Lista de Secrets que NUNCA devem ser expostos:

| Secret | Onde | Como Gerar | Quando Rotacionar |
|--------|------|------------|-------------------|
| `SUPABASE_SERVICE_KEY` | Backend apenas | Supabase Dashboard > API | Se exposto |
| `JWT_SECRET` | Backend | `crypto.randomBytes(64)` | Semestralmente |
| `SESSION_SECRET` | Backend | `crypto.randomBytes(64)` | Semestralmente |
| `DATABASE_URL` (com senha) | Backend | Supabase Dashboard > Database | Se exposto |

### ⚠️ Secrets que SÃO seguros no frontend:

| Variável | Seguro? | Motivo |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | ✅ Sim | URL pública |
| `VITE_SUPABASE_ANON_KEY` | ✅ Sim | Chave pública protegida por RLS |
| `VITE_API_URL` | ✅ Sim | URL pública da API |

### Como Gerar Secrets Seguros

```bash
# JWT_SECRET e SESSION_SECRET (64 caracteres aleatórios)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Exemplo de output:
# a1b2c3d4e5f6...  (128 caracteres hex = 64 bytes)
```

---

## 🌐 Deploy em Plataformas

### Render (Backend)

1. **Acessar Dashboard:**
   - Vá para: https://dashboard.render.com
   - Selecione seu serviço

2. **Configurar Environment Variables:**
   - No menu lateral: Environment
   - Clique em "Add Environment Variable"

3. **Adicionar variáveis do `.env.production.example`:**
   ```
   SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_KEY=eyJhbGc...  ⚠️ CUIDADO!
   DATABASE_URL=postgresql://...
   JWT_SECRET=<secret gerado>
   SESSION_SECRET=<secret gerado>
   CORS_ORIGIN=https://neuroone.jogosadm.com.br
   WS_CORS_ORIGIN=https://neuroone.jogosadm.com.br
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   ```

4. **Salvar e fazer redeploy:**
   - Clique em "Save Changes"
   - Render fará redeploy automático

### Vercel (Frontend)

1. **Acessar Dashboard:**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto

2. **Configurar Environment Variables:**
   - Settings > Environment Variables

3. **Adicionar variáveis `VITE_*`:**
   ```
   VITE_SUPABASE_URL=https://fsszpnbuabhhvrdmrtct.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   VITE_API_URL=https://biosync-jlfh.onrender.com
   VITE_WS_URL=wss://biosync-jlfh.onrender.com
   VITE_APP_ENV=production
   VITE_FEATURE_ANALYTICS=true
   ```

4. **Selecionar Environments:**
   - ✅ Production
   - ✅ Preview (opcional)
   - ❌ Development (use .env local)

5. **Fazer redeploy:**
   ```bash
   # Trigger novo deploy
   git commit --allow-empty -m "chore: redeploy com novas env vars"
   git push origin master
   ```

---

## 🔄 Rotação de Secrets

### Quando rotacionar?

- ✅ **Imediatamente**: Se secret foi exposto (commit, vazamento, etc.)
- ✅ **Semestralmente**: Boa prática de segurança
- ✅ **Troca de equipe**: Quando desenvolvedores saem do projeto
- ✅ **Após auditoria**: Se solicitado por auditoria de segurança

### 1. Rotacionar SUPABASE_SERVICE_KEY

**⚠️ ATENÇÃO**: Vai invalidar todas as chamadas backend ao Supabase!

1. **Acessar Supabase:**
   - Dashboard > Settings > API
   - Scroll até "service_role (secret)"

2. **Resetar chave:**
   - Clique em "Reset service_role key"
   - Confirme a ação
   - **Copie a nova chave** (não será mostrada novamente)

3. **Atualizar em produção:**
   - Render: Environment Variables > Editar `SUPABASE_SERVICE_KEY`
   - Salvar e aguardar redeploy
   - Testar se backend consegue acessar Supabase

4. **Atualizar localmente:**
   ```bash
   # Editar .env
   SUPABASE_SERVICE_KEY=<nova-chave>
   ```

### 2. Rotacionar JWT_SECRET

**⚠️ ATENÇÃO**: Vai deslogar TODOS os usuários!

1. **Gerar novo secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Atualizar em produção:**
   - Render: Editar `JWT_SECRET`
   - Salvar e aguardar redeploy

3. **Notificar usuários:**
   - Todos precisarão fazer login novamente
   - Considere fazer em horário de baixo uso

### 3. Remover .env.production do Git (se commitado por engano)

**IMPORTANTE**: Se você commitou `.env.production` com secrets reais:

```bash
# 1. Remover do histórico do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch neuroone-backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Forçar push (CUIDADO!)
git push origin --force --all

# 3. Rotacionar TODOS os secrets expostos
# - SUPABASE_SERVICE_KEY (via Supabase Dashboard)
# - JWT_SECRET (gerar novo)
# - SESSION_SECRET (gerar novo)
# - DATABASE_URL password (via Supabase > Reset password)
```

### 4. Verificar exposição no Git

```bash
# Buscar por possíveis secrets commitados
git log --all --full-history -- "*.env*"

# Buscar por strings sensíveis
git grep -i "supabase_service_key"
git grep -i "jwt_secret"
```

---

## ✅ Checklist de Segurança

### Antes do Deploy

- [ ] `.env` e `.env.production` estão no `.gitignore`
- [ ] Arquivos `.env.*.example` não contêm valores reais
- [ ] `SUPABASE_SERVICE_KEY` nunca está no frontend
- [ ] `JWT_SECRET` tem no mínimo 64 caracteres aleatórios
- [ ] `SESSION_SECRET` é diferente do `JWT_SECRET`
- [ ] Secrets de produção são diferentes dos de desenvolvimento
- [ ] `NODE_ENV=production` está configurado
- [ ] `CORS_ORIGIN` aponta para URL correta de produção
- [ ] `DATABASE_URL` usa connection pooler (`:5432` ou `:6543`)

### Após Deploy

- [ ] Environment variables configuradas no Render
- [ ] Environment variables configuradas no Vercel
- [ ] Testado login em produção (JWT funcionando)
- [ ] Testado conexão WebSocket em produção
- [ ] Testado criação de sessão (escrita no banco)
- [ ] Verificado logs do Render (sem erros de auth)
- [ ] Verificado logs do Supabase (queries funcionando)

### Auditoria Mensal

- [ ] Revisar quem tem acesso aos secrets
- [ ] Verificar logs de acesso ao Supabase
- [ ] Testar rotação de secrets em staging
- [ ] Atualizar documentação de secrets
- [ ] Fazer backup das configurações

---

## 📚 Referências

- [Supabase: Managing Secrets](https://supabase.com/docs/guides/platform/managing-secrets)
- [Render: Environment Variables](https://render.com/docs/environment-variables)
- [Vercel: Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 🆘 Troubleshooting

### Backend não conecta ao Supabase

```bash
# Verificar se SUPABASE_SERVICE_KEY está correto
curl -X POST https://fsszpnbuabhhvrdmrtct.supabase.co/rest/v1/users \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

# Deve retornar 200 ou 201, não 401 Unauthorized
```

### JWT tokens não funcionam

```bash
# Verificar se JWT_SECRET tem 64+ caracteres
echo -n "$JWT_SECRET" | wc -c  # Deve retornar 128 (64 bytes em hex)

# Verificar se NODE_ENV=production
printenv NODE_ENV  # Deve retornar "production"
```

### Frontend não conecta ao backend

```bash
# Verificar CORS_ORIGIN no backend
echo $CORS_ORIGIN  # Deve ser exatamente a URL do frontend

# Verificar VITE_API_URL no frontend
printenv | grep VITE_API_URL  # Deve ser a URL do Render
```

---

**Última atualização:** 19/11/2025
**Revisado por:** Equipe NeuroOne Educacional
