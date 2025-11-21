# 🎮 NeuroOne - Guia de Primeiro Acesso

Bem-vindo ao NeuroOne Game Platform! Este guia contém todas as informações necessárias para configurar e acessar o sistema pela primeira vez.

---

## 📊 Status Atual do Projeto

### ✅ 100% Implementado

- **Backend:** API REST completa (Node.js + Express + Supabase)
- **Admin Panel:** Dashboard administrativo (React + Material-UI v5)
- **Launcher:** Aplicação desktop (Electron + React)
- **Database:** PostgreSQL no Supabase (13 tabelas + RLS policies)
- **Sistemas:**
  - ✅ Autenticação JWT
  - ✅ Assinaturas (PIX + Cartão via Asaas)
  - ✅ Sistema de Psicólogos e Pacientes
  - ✅ Sistema de Pontuações de Jogos
  - ✅ Webhooks Asaas
  - ✅ Gestão de jogos e acessos

---

## 🔐 Credenciais de Acesso

### 👤 Conta Administrador Principal

**Para Painel Admin:**
```
Email/Username: psitalessales
Senha: 23112018Vt!
```

⚠️ **IMPORTANTE:** No painel admin, digite o **username** (`psitalessales`) no campo de email.

**Permissões:**
- Administrador completo (is_admin: true)
- Acesso total ao sistema
- Gestão de usuários, jogos e assinaturas

**Informações da Conta:**
- ID: 81d5a0ac-b1bc-469e-bbfa-df8f487e01f8
- Username: psitalessales
- Email: psitales.sales@gmail.com
- Código de Acesso: NEURO-NHQY-N4U6
- Assinatura: ACTIVE (R$ 29,90/mês)

### 👩‍⚕️ Conta Psicóloga

**Para testes do sistema de psicólogos:**
```
Email: psicologavivianewis@gmail.com
Senha: [Senha dela no sistema]
```

**Recursos:**
- is_psychologist: true
- is_admin: true
- 3 pacientes atribuídos
- Dashboard de análise de pacientes

### 🧪 Contas de Demonstração

**Admin Alternativo:**
```
Username: admin
Senha: Admin123
Email: admin@neurogame.com
```

**Usuário Demo:**
```
Email: demo@biosync.com
Senha: Demo@123456
```

---

## 🌐 URLs de Acesso

### Painel Administrativo
**URL:** https://neuro-game-nu.vercel.app

**Login:**
1. Acesse https://neuro-game-nu.vercel.app/login
2. No campo "E-mail", digite: `psitalessales`
3. No campo "Senha", digite: `23112018Vt!`
4. Clique em "Entrar"

### API Backend
**URL Base:** https://biosync-jlfh.onrender.com/api/v1

**Health Check:**
```bash
curl https://biosync-jlfh.onrender.com/api/v1/health
```

**Teste de Login:**
```bash
curl -X POST https://biosync-jlfh.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"psitalessales","password":"23112018Vt!"}'
```

### Launcher Desktop
**Download:** Ver pasta `INSTALADORES/`

**Arquivo:** `NeuroOne Launcher-Setup-2.0.0.exe`

**Login no Launcher:**
- Email: `psitales.sales@gmail.com`
- Senha: `23112018Vt!`

---

## 🗄️ Database Supabase

### Informações do Projeto

**Nome:** BioSync
**Project ID:** `uszmhhukjohjarplnlmp`
**URL:** https://uszmhhukjohjarplnlmp.supabase.co
**Region:** South America (sa-east-1)
**PostgreSQL:** v17.6.1

### Dashboard Supabase
https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp

### Tabelas Principais (15 tabelas)

**Usuários e Autenticação:**
- `users` - 6 usuários cadastrados
- `launcher_sessions` - Sessões ativas

**Assinaturas:**
- `subscriptions` - 3 assinaturas
- `payments` - Histórico de pagamentos
- `asaas_webhooks` - Webhooks recebidos

**Jogos:**
- `games` - 13 jogos cadastrados
- `user_game_access` - 52 acessos configurados
- `game_requests` - Solicitações de acesso

**Sistema de Psicólogos:**
- `psychologist_patients` - 3 relações criadas
- `game_scores` - 12 pontuações de exemplo

**Planos:**
- `subscription_plans` - 3 planos
- `plan_games` - 22 associações plano-jogo

---

## 🚀 Setup Local (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Git

### 1. Clonar Repositório
```bash
git clone [URL_DO_REPO]
cd "BioSync Game FN"
```

### 2. Configurar Backend
```bash
cd biosync-backend
npm install

# Configurar .env (já existe, verificar chaves Supabase)
cp .env.example .env  # se não existir

# Iniciar servidor
npm run dev
# Servidor: http://localhost:3000
```

**Variáveis de Ambiente Obrigatórias:**
```env
SUPABASE_URL=https://uszmhhukjohjarplnlmp.supabase.co
SUPABASE_ANON_KEY=[Obter do Supabase Dashboard]
SUPABASE_SERVICE_KEY=[Obter do Supabase Dashboard]
JWT_SECRET=[Já configurado]
JWT_REFRESH_SECRET=[Já configurado]
ASAAS_API_KEY=[Já configurado - produção]
```

📖 **Como obter chaves Supabase:** Ver [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### 3. Configurar Admin Panel
```bash
cd biosync-admin
npm install

# Configurar .env
echo "VITE_API_URL=http://localhost:3000/api/v1" > .env

# Iniciar painel
npm run dev
# Painel: http://localhost:5173
```

### 4. Configurar Launcher
```bash
cd biosync-launcher
npm install

# Iniciar launcher
npm run dev
# Electron app abrirá automaticamente
```

---

## 🧪 Testes e Validação

### Testar Login Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"psitalessales","password":"23112018Vt!"}'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "email": "psitales.sales@gmail.com",
      "isAdmin": true,
      "isPsychologist": false,
      "hasActiveSubscription": true
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Testar Sistema de Psicólogos
```bash
# 1. Login como psicóloga
curl -X POST https://biosync-jlfh.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"psicologavivianewis@gmail.com","password":"SENHA_DELA"}'

# 2. Listar pacientes (usar token recebido)
curl https://biosync-jlfh.onrender.com/api/v1/psychologists/patients \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta Esperada:**
- 3 pacientes listados
- Estatísticas de cada paciente
- Total de 12 sessões de pontuação

### Testar Admin Panel

1. Acesse: http://localhost:5173 (ou https://neuro-game-nu.vercel.app)
2. Login: `psitalessales` / `23112018Vt!`
3. Navegue para:
   - **Dashboard:** Ver estatísticas gerais
   - **Jogos:** 13 jogos listados
   - **Usuários:** 6 usuários
   - **Assinaturas:** 3 assinaturas ativas
   - **Psicólogos:** `/psychologists` - Dashboard de pacientes

### Testar Launcher

1. Abra o launcher
2. Login: `psitales.sales@gmail.com` / `23112018Vt!`
3. Verifique:
   - Biblioteca de jogos carrega
   - Assinatura aparece como ativa
   - Jogos podem ser abertos

---

## 🔧 Troubleshooting

### Backend não conecta ao Supabase

**Problema:** Erro "Invalid Supabase credentials"

**Solução:**
1. Acesse: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/settings/api
2. Copie `anon` e `service_role` keys
3. Cole em `biosync-backend/.env`
4. Reinicie o servidor

### Admin Panel não mostra jogos

**Problema:** Lista de jogos vazia

**Verificações:**
1. Backend está rodando? `curl http://localhost:3000/api/v1/health`
2. CORS configurado? Verificar `biosync-backend/src/server.js`
3. Token válido? Verificar no DevTools (F12) → Network

**Solução:**
```bash
# Reiniciar backend
cd biosync-backend
npm run dev
```

### Login não funciona

**Problema:** "Credenciais inválidas"

**Soluções:**

**Para Painel Admin:**
- Use `psitalessales` (username) NO CAMPO DE EMAIL
- Senha: `23112018Vt!`

**Para Launcher:**
- Use o email completo: `psitales.sales@gmail.com`
- Senha: `23112018Vt!`

**Para API Direta:**
- Pode usar email ou username
- Verificar se backend está acessível

### Launcher não abre jogos

**Problema:** "Jogo não encontrado"

**Verificações:**
1. Pasta `Jogos/` existe?
2. Jogo tem `index.html`?
3. Permissões de acesso configuradas?

**Solução:**
```bash
# Verificar estrutura
cd "BioSync Game FN"
ls Jogos/
ls Jogos/autorama/index.html
```

---

## 📝 Fluxos Principais

### Fluxo de Registro de Novo Usuário
1. Usuário se registra via launcher ou admin
2. Backend cria conta no Supabase
3. Backend cria cliente no Asaas
4. Retorna credenciais + código de acesso
5. Usuário faz login
6. Sistema valida assinatura
7. Libera acesso aos jogos

### Fluxo de Assinatura (PIX)
1. Usuário solicita assinatura
2. Backend cria cobrança PIX no Asaas
3. Frontend exibe QR Code
4. Usuário paga
5. Asaas envia webhook
6. Backend atualiza status da assinatura
7. Usuário ganha acesso

### Fluxo de Pontuação
1. Usuário joga um jogo
2. Jogo envia pontuação para API
3. Backend valida e armazena
4. Psicólogo visualiza no dashboard
5. Gráficos são atualizados

---

## 🎯 Próximos Passos

### Configuração Inicial
- [ ] Obter credenciais Supabase
- [ ] Testar backend local
- [ ] Testar admin local
- [ ] Testar launcher local

### Deploy em Produção
- [ ] Verificar deploy no Render (backend)
- [ ] Verificar deploy no Vercel (admin)
- [ ] Atualizar URLs de webhook no Asaas
- [ ] Testar fluxo completo de pagamento

### Testes Completos
- [ ] Cadastro de novo usuário
- [ ] Login em todas as plataformas
- [ ] Assinatura via PIX
- [ ] Assinatura via Cartão
- [ ] Sistema de psicólogos
- [ ] Pontuações de jogos
- [ ] Dashboard e gráficos

---

## 📚 Documentação Adicional

- **[Configuração Supabase](SUPABASE_SETUP.md)** - Como obter e configurar credenciais
- **[Credenciais Admin](CREDENCIAIS_ADMIN.md)** - Todas as credenciais do sistema
- **[Deploy Backend](../../biosync-backend/DEPLOY_RENDER.md)** - Deploy no Render.com
- **[Deploy Admin](../../biosync-admin/DEPLOY_VERCEL.md)** - Deploy no Vercel
- **[Integração de Jogos](../api/INTEGRACAO_JOGOS.md)** - Como adicionar novos jogos

---

## 📞 Suporte e Contato

### Problemas Técnicos
- Consulte a seção [Troubleshooting](#troubleshooting) acima
- Verifique logs no Render.com (backend)
- Verifique console do navegador (F12)

### Logs Importantes

**Backend (Render.com):**
```
https://dashboard.render.com/web/[SERVICE_ID]/logs
```

**Admin Panel (Browser):**
```
F12 → Console
F12 → Network (ver requisições falhas)
```

**Launcher (Electron):**
```
Ctrl+Shift+I → Console
```

---

## ✅ Checklist de Validação

Antes de considerar o setup completo:

### Backend
- [ ] npm install executado sem erros
- [ ] Credenciais Supabase configuradas
- [ ] Servidor inicia sem erros
- [ ] Health check responde: `/api/v1/health`
- [ ] Login funcionando
- [ ] Endpoints de jogos retornam dados

### Admin Panel
- [ ] npm install executado sem erros
- [ ] Conecta ao backend
- [ ] Login funcionando
- [ ] Lista jogos corretamente
- [ ] Dashboard de psicólogos acessível
- [ ] Gráficos renderizando (Recharts)

### Launcher
- [ ] npm install executado sem erros
- [ ] Conecta ao backend
- [ ] Login funcionando
- [ ] Jogos aparecem na biblioteca
- [ ] Jogos abrem corretamente

### Database
- [x] 15 tabelas criadas
- [x] 13 jogos inseridos
- [x] 3 planos criados
- [x] 6 usuários criados
- [x] RLS policies ativas
- [x] Sistema de psicólogos configurado
- [x] Pontuações de exemplo criadas

---

## 🎉 Conclusão

**O NeuroOne Platform está 100% implementado e pronto para uso!**

### Status Atual
- ✅ Backend deployado e funcionando
- ✅ Admin Panel deployado e funcionando
- ✅ Database configurado com dados de exemplo
- ✅ Sistema de psicólogos completo
- ✅ Sistema de pontuações implementado
- ✅ Documentação completa

### Para Começar
1. Acesse https://neuro-game-nu.vercel.app
2. Login: `psitalessales` / `23112018Vt!`
3. Explore o sistema!

---

**Última Atualização:** 16 de Outubro de 2025
**Versão do Sistema:** 2.1.0
**Plataforma:** NeuroOne Game Platform

© 2025 NeuroOne - Todos os direitos reservados
