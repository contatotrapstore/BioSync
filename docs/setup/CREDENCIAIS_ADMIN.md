# 🔑 Credenciais Admin - NeuroGame

## ✅ Conta Administrador Criada

**Email:** psitales.sales@gmail.com
**Senha:** 23112018Vt!
**Username:** psitalessales

### 🎯 Como Fazer Login

**⚠️ IMPORTANTE: Use APENAS o USERNAME para login no painel admin!**

```json
{
  "username": "psitalessales",
  "password": "23112018Vt!"
}
```

**❌ NÃO USE o email** (existe um bug no backend de produção com este usuário específico):
```json
{
  "email": "psitales.sales@gmail.com",  // ❌ NÃO FUNCIONA
  "password": "23112018Vt!"
}
```

**✅ SOLUÇÃO:** No painel admin (https://neuro-game-nu.vercel.app/login), digite no campo "E-mail":
- **Digite:** `psitalessales` (o username)
- **Senha:** `23112018Vt!`

---

## 📊 Informações da Conta

**ID:** 81d5a0ac-b1bc-469e-bbfa-df8f487e01f8
**Permissões:** Administrador (is_admin: true)
**Status:** Ativo (is_active: true)
**Código de Acesso:** NEURO-NHQY-N4U6

---

## 💳 Assinatura

**Status:** ✅ ACTIVE
**Plano:** Mensal
**Valor:** R$ 29,90/mês
**Próximo Vencimento:** 06/11/2025
**Método:** ADMIN_MANUAL

---

## 🔗 Links de Acesso

### Painel Admin
https://neuro-game-nu.vercel.app/login

**Login (ATENÇÃO - leia com cuidado!):**
- **No campo "E-mail"**: digite `psitalessales` (sim, o username!)
- **No campo "Senha"**: digite `23112018Vt!`
- ⚠️ O backend aceita username no campo email!

### API Backend
https://biosync-jlfh.onrender.com

### Launcher Desktop
Baixe o instalador em: `INSTALADORES/NeuroGame Launcher Setup 1.0.9.exe`

**Login no Launcher:**
- Email: `psitales.sales@gmail.com`
- Senha: `23112018Vt!`

---

## 🧪 Teste de Login (API)

### Com cURL:
```bash
curl -X POST https://biosync-jlfh.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"psitalessales","password":"23112018Vt!"}'
```

### Resposta Esperada:
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "email": "psitales.sales@gmail.com",
      "isAdmin": true,
      "hasActiveSubscription": true
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## ✅ Testes Confirmados

- ✅ Conta criada via API de registro
- ✅ Senha hashada com bcrypt corretamente
- ✅ Permissões de admin configuradas
- ✅ Assinatura ACTIVE criada (válida por 30 dias)
- ✅ Login com username funcionando
- ✅ Token JWT gerado corretamente

---

## 🔧 Outras Contas Disponíveis

### Admin Padrão
**Email:** admin@neurogame.com
**Senha:** Admin123
**Username:** admin

---

---

## 🐛 Problema Conhecido

**Bug:** O login com email `psitales.sales@gmail.com` não funciona no backend de produção, mas o login com username `psitalessales` funciona perfeitamente.

**Causa:** Possível cache ou problema de sincronização no Render.

**Workaround:** Use sempre o username `psitalessales` no campo de email do painel admin.

---

**Última Atualização:** 07/10/2025 17:00
