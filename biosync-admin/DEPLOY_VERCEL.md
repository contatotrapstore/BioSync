# 🚀 Deploy do Admin Panel na Vercel

## ❗ CORREÇÃO APLICADA

O código foi corrigido para adicionar automaticamente `/api/v1` ao final da URL do backend.

**Antes:** Você precisava configurar `VITE_API_URL=https://neurogame.onrender.com/api/v1`
**Agora:** Configure apenas `VITE_API_URL=https://neurogame.onrender.com`

---

## ⚙️ Configuração na Vercel

### 1. Acesse o Dashboard da Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Selecione seu projeto do admin
3. Clique em **Settings** (no menu superior)
4. Clique em **Environment Variables** (menu lateral)

### 2. Configure a Variável de Ambiente

Adicione a seguinte variável:

**Nome da Variável:**
```
VITE_API_URL
```

**Valor da Variável (IMPORTANTE - SEM /api/v1):**
```
https://neurogame.onrender.com
```

**Environment:** Production (e Development, se quiser)

### 3. Clique em "Save"

### 4. Faça um Redeploy

Após salvar a variável, você DEVE fazer um novo deploy:

**Opção A - Via Dashboard:**
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deployment
3. Clique em **Redeploy**

**Opção B - Via Git:**
```bash
cd neurogame-admin
git add .
git commit -m "fix: corrigir URL da API para produção"
git push
```

---

## ✅ Como Verificar se Funcionou

### 1. Abra o DevTools do Navegador
- Pressione `F12` no Chrome/Edge
- Vá na aba **Network**

### 2. Tente Fazer Login
- Usuário: `admin`
- Senha: `Admin123`

### 3. Veja a Requisição
Você deve ver uma requisição para:
```
POST https://neurogame.onrender.com/api/v1/auth/login
```

**Status esperado:** `200 OK` ✅

---

## 🐛 Troubleshooting

### Erro 404 - Not Found
❌ **Problema:** `POST https://neurogame.onrender.com/auth/login 404`
✅ **Solução:** Você configurou a URL COM `/api/v1` no final. Remova!

**Configuração ERRADA:**
```
VITE_API_URL=https://neurogame.onrender.com/api/v1  ❌
```

**Configuração CORRETA:**
```
VITE_API_URL=https://neurogame.onrender.com  ✅
```

### Erro CORS
❌ **Problema:** `Access to fetch at '...' has been blocked by CORS policy`
✅ **Solução:** Configure a variável `CORS_ORIGIN` no backend (Render)

No **Render Dashboard** > Backend Service > Environment:
```
CORS_ORIGIN=https://seu-admin.vercel.app,https://neurogame.onrender.com
```

### Erro 401 - Unauthorized
❌ **Problema:** Login retorna 401
✅ **Soluções possíveis:**
1. Verifique se o backend está rodando (acesse `https://neurogame.onrender.com/api/v1/health`)
2. Verifique se as credenciais estão corretas: `admin` / `Admin123`
3. Verifique se o JWT_SECRET está configurado no backend (Render)

### Erro 500 - Internal Server Error
❌ **Problema:** Servidor retorna erro 500
✅ **Solução:** Verifique os logs do backend no Render:
- Render Dashboard > seu serviço backend > Logs
- Procure por erros de conexão com Supabase ou JWT

---

## 📋 Checklist de Deploy

- [ ] Código do admin atualizado com correção de URL
- [ ] Variável `VITE_API_URL` configurada na Vercel (SEM /api/v1)
- [ ] Redeploy feito na Vercel
- [ ] Backend rodando no Render (`/api/v1/health` retorna 200)
- [ ] CORS configurado no backend (incluindo URL da Vercel)
- [ ] Teste de login funcionando

---

## 🔗 URLs Importantes

**Admin na Vercel:**
```
https://seu-projeto-admin.vercel.app
```

**Backend no Render:**
```
https://neurogame.onrender.com
```

**API Health Check:**
```
https://neurogame.onrender.com/api/v1/health
```

**API Login:**
```
https://neurogame.onrender.com/api/v1/auth/login
```

---

## 💡 Dicas Extras

### Teste Local Antes de Deploy
```bash
# No terminal
cd neurogame-admin

# Configure URL de produção
echo "VITE_API_URL=https://neurogame.onrender.com" > .env.local

# Rode em modo de produção local
npm run build
npm run preview
```

### Ver Logs em Tempo Real (Vercel)
```bash
npm i -g vercel
vercel login
vercel logs --follow
```

---

## 📞 Suporte

Se o erro persistir:
1. Verifique os logs do backend no Render
2. Verifique as variáveis de ambiente na Vercel
3. Teste a API diretamente com curl:

```bash
curl -X POST https://neurogame.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}'
```

Deve retornar:
```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": { ... }
  }
}
```

---

**Desenvolvido com Claude Code**
