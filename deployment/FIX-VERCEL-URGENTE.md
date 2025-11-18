# 🚨 CORREÇÃO URGENTE - Erro no Vercel

## Problema Identificado

O Vercel está procurando o diretório `biosync-admin` mas o correto é `      `.

**Erro atual**: `The specified Root Directory "biosync-admin" does not exist`

## Solução Rápida (2 minutos)

### Passo 1: Acessar Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Faça login
3. Localize o projeto `bio-sync-git-master-neuro-la-labs-projects`

### Passo 2: Corrigir Root Directory

1. Clique no projeto
2. Vá em **Settings** (configurações)
3. No menu lateral, clique em **General**
4. Procure a seção **"Root Directory"**
5. Clique em **"Edit"** ao lado de Root Directory
6. **MUDE DE**: `biosync-admin`
7. **PARA**: `neuroone-frontend`
8. Clique em **"Save"**

### Passo 3: Forçar Novo Deploy

Após salvar a configuração:

1. Vá na aba **"Deployments"**
2. Clique nos 3 pontinhos (...) do último deploy
3. Escolha **"Redeploy"**
4. Aguarde o build (1-3 minutos)

## Verificação

Após redeploy bem-sucedido, você verá:

✅ Build Success (sem erros)
✅ URL gerada: `https://bio-sync-git-master-neuro-la-labs-projects.vercel.app`

Acesse a URL para confirmar que o frontend está carregando.

## Se Ainda Houver Erros

Verifique também:

### Build Command
- Deve estar: `npm run build` ou `vite build`

### Output Directory
- Deve estar: `dist`

### Install Command
- Deve estar: `npm install`

### Node.js Version
- Recomendado: `18.x` ou `20.x`

---

**Tempo estimado**: 2 minutos
**Após correção**, prossiga para: [01-SUPABASE-SETUP.md](01-SUPABASE-SETUP.md)
