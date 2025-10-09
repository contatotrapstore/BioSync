# 🚀 Deploy do Admin Panel na Vercel - Passo a Passo

## ✅ Pré-requisitos

Antes de começar, certifique-se de que você tem:

- [x] Conta no GitHub (crie em https://github.com)
- [x] Conta na Vercel (crie em https://vercel.com - pode usar login do GitHub)
- [x] Git instalado no seu computador
- [x] Backend já deployado (você precisa da URL do backend)

---

## 📋 Visão Geral

O processo de deploy tem 3 etapas principais:

1. **Subir código para o GitHub** (repositório)
2. **Conectar GitHub com Vercel** (importar projeto)
3. **Configurar variáveis de ambiente** (URL do backend)

**Tempo estimado:** 10-15 minutos

---

## 🔧 ETAPA 1: Preparar o Projeto (Git e GitHub)

### 1.1 Inicializar Git (se ainda não fez)

```bash
# Vá para a pasta do projeto principal
cd C:\Users\GouveiaRx\Downloads\NeuroGame

# Verificar se git já está inicializado
git status

# Se não estiver, inicialize:
git init
git add .
git commit -m "feat: Projeto NeuroGame completo pronto para deploy"
```

### 1.2 Criar Repositório no GitHub

1. **Acesse:** https://github.com
2. **Clique em:** "New repository" (botão verde)
3. **Preencha:**
   - Repository name: `neurogame-platform`
   - Description: `NeuroGame - Plataforma de distribuição de jogos`
   - Visibilidade: **Private** (recomendado) ou Public
4. **NÃO marque:** "Add a README file"
5. **Clique em:** "Create repository"

### 1.3 Conectar Local com GitHub

```bash
# Copie o link do repositório que apareceu
# Exemplo: https://github.com/seu-usuario/neurogame-platform.git

# Execute os comandos (substitua pela sua URL):
git remote add origin https://github.com/seu-usuario/neurogame-platform.git
git branch -M master
git push -u origin master
```

**Se pedir login:**
- Use seu username do GitHub
- Password: use um **Personal Access Token** (não a senha)
  - Crie em: https://github.com/settings/tokens
  - Permissões: `repo` completo

---

## 🌐 ETAPA 2: Deploy na Vercel

### 2.1 Acessar Vercel

1. **Acesse:** https://vercel.com
2. **Clique em:** "Sign Up" (se não tem conta) ou "Login"
3. **Escolha:** "Continue with GitHub"
4. **Autorize** a Vercel a acessar sua conta GitHub

### 2.2 Importar Projeto

1. **No Dashboard da Vercel, clique em:** "Add New..." → "Project"

2. **Autorize a Vercel a acessar seus repositórios:**
   - Clique em "Adjust GitHub App Permissions"
   - Selecione "All repositories" ou apenas o `neurogame-platform`
   - Clique em "Install"

3. **Encontre seu repositório** na lista e clique em "Import"

### 2.3 Configurar o Projeto

Na tela de configuração:

#### 📂 Configure Root Directory:
**IMPORTANTE:** Como temos múltiplos projetos na mesma pasta, precisamos especificar:

- **Root Directory:** `neurogame-admin`
- Clique em "Edit" ao lado de "Root Directory"
- Digite: `neurogame-admin`
- Clique em "Continue"

#### ⚙️ Build Settings (a Vercel detecta automaticamente):
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### 🔐 Environment Variables (IMPORTANTE):

Clique em "Add" e adicione:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://api.neurogame.com.br/api/v1` | Production |

**⚠️ IMPORTANTE:** Substitua `https://api.neurogame.com.br/api/v1` pela URL REAL do seu backend!

**Se seu backend está em:**
- Heroku: `https://neurogame-api.herokuapp.com/api/v1`
- Railway: `https://neurogame-api.up.railway.app/api/v1`
- Render: `https://neurogame-api.onrender.com/api/v1`
- VPS próprio: `https://api.seudominio.com.br/api/v1`
- **Local (para testes):** `http://localhost:3000/api/v1`

### 2.4 Fazer Deploy

1. **Clique em:** "Deploy"
2. **Aguarde** (leva 1-2 minutos)
3. **Quando terminar,** você verá uma tela de sucesso 🎉

---

## 🎯 ETAPA 3: Verificar e Testar

### 3.1 Acessar o Site

Após o deploy, a Vercel gera uma URL automática:

```
https://neurogame-platform-seu-usuario.vercel.app
```

**Clique em "Visit"** para acessar

### 3.2 Configurar Domínio Personalizado (Opcional)

Se você tem um domínio próprio:

1. No dashboard do projeto, clique em **"Settings"** → **"Domains"**
2. Digite seu domínio (ex: `admin.neurogame.com.br`)
3. Siga as instruções para configurar DNS

### 3.3 Testar o Admin Panel

1. **Acesse a URL do seu site**
2. **Vá para a página de Login**
3. **Faça login com:**
   - Username: `admin`
   - Password: `Admin123`

**✅ Se conseguir fazer login, está tudo funcionando!**

---

## 🔄 Atualizações Automáticas

A partir de agora, **toda vez que você fizer push para o GitHub,** a Vercel vai automaticamente:

1. Detectar as mudanças
2. Fazer novo build
3. Fazer deploy automaticamente

```bash
# No seu computador, após fazer alterações:
cd neurogame-admin
# ... faça suas alterações ...

# Commit e push
git add .
git commit -m "feat: alguma alteração"
git push

# A Vercel vai deployar automaticamente em 1-2 minutos!
```

---

## 🐛 Troubleshooting (Solução de Problemas)

### ❌ Erro: "VITE_API_URL is not defined"

**Solução:**
1. Vá em **Settings** → **Environment Variables**
2. Adicione `VITE_API_URL` com a URL do seu backend
3. Clique em **"Redeploy"** para fazer novo deploy

### ❌ Erro: "Network Error" ou "Failed to fetch"

**Causas possíveis:**
1. **URL do backend incorreta** - Verifique a variável `VITE_API_URL`
2. **CORS não configurado no backend** - O backend precisa permitir a URL do Vercel

**Solução para CORS:**

No seu backend, arquivo `.env` em produção:

```env
ALLOWED_ORIGINS=https://neurogame-platform-seu-usuario.vercel.app,https://admin.neurogame.com.br
```

### ❌ Erro de Build: "Failed to compile"

**Solução:**
1. Teste o build localmente primeiro: `npm run build`
2. Corrija os erros localmente
3. Faça commit e push novamente

### ❌ Página em branco após deploy

**Solução:**
1. Abra o DevTools do navegador (F12)
2. Veja o Console para erros
3. Geralmente é problema de variável de ambiente

---

## 📊 Monitoramento

### Ver Logs de Deploy

1. No dashboard da Vercel
2. Clique no seu projeto
3. Vá em **"Deployments"**
4. Clique em qualquer deploy para ver logs detalhados

### Analytics (Opcional)

A Vercel oferece analytics gratuitos:
- Vá em **"Analytics"** no dashboard
- Veja pageviews, visitantes únicos, etc.

---

## 🔒 Segurança

### Variáveis de Ambiente

✅ **SIM - Adicione na Vercel:**
- `VITE_API_URL`

❌ **NÃO - Nunca commite no Git:**
- Arquivo `.env` com valores reais
- Senhas
- API Keys secretas

### Headers de Segurança

Já configurados no `vercel.json`:
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block

---

## 💰 Custos

**Plano Free da Vercel:**
- ✅ 100GB de bandwidth/mês
- ✅ Deploy ilimitados
- ✅ HTTPS automático
- ✅ Custom domains
- ✅ **Totalmente GRÁTIS** para projetos pequenos/médios

**Limite:**
- Se ultrapassar 100GB/mês, você pode fazer upgrade para Pro ($20/mês)
- Para o NeuroGame Admin, 100GB é MUITO e provavelmente nunca vai acabar

---

## 📋 Checklist Final

Antes de considerar concluído, verifique:

- [ ] Projeto deployado na Vercel
- [ ] URL funcionando
- [ ] Login funciona
- [ ] Consegue ver lista de jogos
- [ ] Consegue criar/editar jogos
- [ ] Consegue ver usuários
- [ ] CORS configurado no backend para aceitar a URL da Vercel
- [ ] Variável `VITE_API_URL` configurada corretamente
- [ ] (Opcional) Domínio customizado configurado

---

## 🎯 URLs Importantes

Após o deploy, salve estas URLs:

| Serviço | URL | Usado para |
|---------|-----|------------|
| **Admin Panel** | https://seu-projeto.vercel.app | Acesso ao admin |
| **Backend API** | https://api.neurogame.com.br | API do sistema |
| **GitHub Repo** | https://github.com/seu-usuario/neurogame-platform | Código fonte |
| **Vercel Dashboard** | https://vercel.com/seu-usuario/seu-projeto | Gerenciar deploy |

---

## 🚀 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ **Compartilhe a URL** com outros admins
2. ✅ **Configure domínio personalizado** (se tiver)
3. ✅ **Adicione usuários admin** via interface
4. ✅ **Configure os dados de download** dos jogos
5. ✅ **Teste o fluxo completo** de um usuário

---

## 📞 Suporte

**Problemas com Vercel:**
- Documentação: https://vercel.com/docs
- Status: https://www.vercel-status.com

**Problemas com o projeto:**
- Verifique os logs no dashboard da Vercel
- Teste localmente primeiro com `npm run dev`
- Verifique se o backend está online

---

## 🎉 Parabéns!

Se você chegou até aqui e tudo está funcionando, seu Admin Panel está **em produção** e acessível pela internet! 🚀

**Desenvolvido com NeuroGame Platform v1.0.0**
