# 🚀 Deploy NeuroOne Admin no Vercel

**Data:** 2025-10-09
**Backend:** https://NeuroOne-jlfh.onrender.com ✅ Online

---

## ✅ Correções Aplicadas

### 1. **Vite movido para dependencies**
- ❌ Antes: `devDependencies` (não instalado em produção)
- ✅ Agora: `dependencies` (instalado em produção)

### 2. **URL da API atualizada**
- ❌ Antes: `https://NeuroOne.onrender.com`
- ✅ Agora: `https://NeuroOne-jlfh.onrender.com`

---

## 📋 Passo a Passo - Deploy no Vercel

### 1. **Acesse o Vercel**
https://vercel.com/dashboard

### 2. **Crie Novo Projeto**
1. Clique em **"Add New..."** → **"Project"**
2. Selecione repositório: `contatotrapstore/NeuroOne`
3. Clique em **"Import"**

### 3. **Configurar Build**

#### Framework Preset:
```
Vite
```

#### Root Directory:
```
NeuroOne-admin
```

#### Build Command:
```
npm run build
```

#### Output Directory:
```
dist
```

#### Install Command:
```
npm install
```

### 4. **Variáveis de Ambiente**

Clique em **"Environment Variables"** e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_API_URL` | `https://NeuroOne-jlfh.onrender.com` | Production |

**IMPORTANTE:** NÃO incluir `/api/v1` no final!

### 5. **Deploy**

Clique em **"Deploy"**

O Vercel vai:
1. ✅ Clonar o repositório
2. ✅ Instalar dependências (incluindo Vite agora!)
3. ✅ Rodar `vite build`
4. ✅ Fazer deploy da pasta `dist/`

---

## 🔍 Verificar Deploy

Após deploy, teste:

### 1. **Acessar URL**
```
https://seu-projeto.vercel.app
```

### 2. **Testar Login**
```
Email: admin@NeuroOne.com
Senha: Admin@123456
```

### 3. **Verificar API**
Abra DevTools (F12) → Network

Deve mostrar requisições para:
```
https://NeuroOne-jlfh.onrender.com/api/v1/auth/login
```

---

## 🐛 Troubleshooting

### Erro: "vite: command not found"
**Solução:** ✅ Já corrigido! Vite está em `dependencies` agora.

### Erro: "Failed to connect to backend"
**Verificar:**
1. Backend está online? https://NeuroOne-jlfh.onrender.com/api/v1/health
2. Variável `VITE_API_URL` está configurada no Vercel?
3. CORS permitindo domínio do Vercel no backend?

### Erro: "404 Not Found" ao recarregar página
**Solução:** ✅ Já configurado! `vercel.json` tem rewrites.

---

## 🔄 Redeploy (Após mudanças)

### Opção 1: Automático (Push Git)
```bash
git add .
git commit -m "fix: update admin for NeuroOne"
git push origin master
```
Vercel detecta push e faz redeploy automático.

### Opção 2: Manual (Dashboard)
1. Acesse projeto no Vercel
2. Vá em **"Deployments"**
3. Clique em **"..."** no último deploy
4. Selecione **"Redeploy"**

---

## ✅ Checklist Pré-Deploy

- [x] ✅ Vite em `dependencies`
- [x] ✅ URL do backend atualizada
- [x] ✅ vercel.json configurado
- [x] ✅ Backend online (Render)
- [ ] ⏳ Variável `VITE_API_URL` no Vercel
- [ ] ⏳ Deploy realizado
- [ ] ⏳ Teste de login funcionando

---

## 📦 Arquivos Importantes

### package.json
```json
{
  "dependencies": {
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1"
  }
}
```

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### .env (local)
```env
VITE_API_URL=http://localhost:3000
```

### Environment Variables (Vercel)
```env
VITE_API_URL=https://NeuroOne-jlfh.onrender.com
```

---

## 🎯 URLs Finais

| Serviço | URL |
|---------|-----|
| **Backend** | https://NeuroOne-jlfh.onrender.com |
| **Admin** | https://seu-projeto.vercel.app |
| **Repositório** | https://github.com/contatotrapstore/NeuroOne |

---

**Gerado em:** 2025-10-09
**Status:** ✅ Pronto para deploy

