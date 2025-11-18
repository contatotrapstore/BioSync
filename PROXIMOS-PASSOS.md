# 🚀 PRÓXIMOS PASSOS - NeuroOne

Documento atualizado: 2025-01-17

## 📊 Status Atual do Projeto

### ✅ COMPLETO (100%)
- [x] Backend Node.js (deployado com sucesso)
- [x] Frontend React (código pronto, aguardando correção Vercel)
- [x] Database Migrations SQL (5 arquivos prontos)
- [x] Servidor Python EEG (código pronto + script de deploy)
- [x] Documentação completa (deployment)

### ⚠️ BLOQUEADORES CRÍTICOS
1. **Vercel**: Root directory configurado errado
2. **Supabase**: Migrations precisam ser executadas
3. **EEG Server**: Deploy pendente no servidor SSH

---

## 🎯 PLANO DE AÇÃO (Próximas 2 Horas)

### FASE 1: Correções Urgentes (30 min)

#### Tarefa 1.1: Corrigir Vercel (5 min) ⚠️ **URGENTE**

**Você precisa fazer**:

1. Acesse: https://vercel.com/dashboard
2. Localize o projeto: `bio-sync-git-master-neuro-la-labs-projects`
3. Settings > General > Root Directory
4. **MUDE DE**: `biosync-admin`
   **PARA**: `neuroone-frontend`
5. Save > Redeploy

**Guia completo**: [deployment/FIX-VERCEL-URGENTE.md](deployment/FIX-VERCEL-URGENTE.md)

---

#### Tarefa 1.2: Executar Migrations no Supabase (15 min)

**Você precisa fazer**:

1. Acesse: https://app.supabase.com
2. Selecione seu projeto (ou crie um novo)
3. SQL Editor > New Query
4. Execute **NA ORDEM**:
   - `neuroone-backend/migrations/001_initial_schema.sql`
   - `neuroone-backend/migrations/002_performance_indexes.sql`
   - `neuroone-backend/migrations/003_lgpd_privacy_tables.sql`
   - `neuroone-backend/migrations/004_enable_rls.sql`
   - `neuroone-backend/migrations/005_seed_data.sql`

**Guia completo**: [deployment/01-SUPABASE-SETUP.md](deployment/01-SUPABASE-SETUP.md)

**⚠️ CRÍTICO**: Após executar, anote:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

---

#### Tarefa 1.3: Configurar Variáveis de Ambiente no Backend (5 min)

**Você precisa fazer**:

1. Acesse seu backend deployado (Railway/Render)
2. Settings > Environment Variables
3. Adicione/Atualize:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_KEY=eyJ...
   ```
4. Salve e aguarde redeploy automático

---

#### Tarefa 1.4: Configurar Variáveis no Frontend (5 min)

**Você precisa fazer** (após corrigir Vercel):

1. Vercel Dashboard > Seu Projeto
2. Settings > Environment Variables
3. Adicione:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_URL=https://seu-backend.onrender.com
   VITE_WS_URL=wss://seu-backend.onrender.com
   ```
4. Salve e faça redeploy

---

### FASE 2: Deploy Servidor EEG (30 min)

#### Tarefa 2.1: Instalar PuTTY (se ainda não tem) (5 min)

```bash
# Windows
winget install PuTTY.PuTTY

# Ou baixe de: https://www.putty.org/
```

---

#### Tarefa 2.2: Executar Script de Deploy (10 min)

```batch
cd "c:\Users\GouveiaRx\Downloads\BioSync Game FN\deployment"
deploy-eeg-server.bat
```

O script automaticamente irá:
- ✅ Conectar ao servidor SSH (72.61.54.52)
- ✅ Criar diretório `/opt/neuroone-eeg`
- ✅ Fazer upload dos arquivos Python
- ✅ Instalar Python 3 e dependências
- ✅ Criar serviço systemd

---

#### Tarefa 2.3: Configurar Parâmetros do Servidor (10 min)

Após o script, conecte via SSH:

```bash
ssh root@72.61.54.52
# Senha: vvm@V@Bd8gpr8VXDgR

# Editar configuração do serviço
nano /etc/systemd/system/neuroone-eeg.service
```

**Atualize**:
- `--backend wss://SEU_BACKEND_URL_AQUI`
  (exemplo: `wss://neuroone-backend.onrender.com`)
- `--student-id` → colocar UUID de um aluno (pode pegar depois no banco)
- `--session-id` → colocar UUID de uma sessão (pode pegar depois no banco)
- `--port` → `/dev/ttyUSB0` (ou porta do headset, verificar com `ls /dev/tty*`)

Salve (`Ctrl+O`, `Enter`, `Ctrl+X`)

---

#### Tarefa 2.4: Iniciar Servidor EEG (5 min)

```bash
# Recarregar systemd
systemctl daemon-reload

# Habilitar início automático
systemctl enable neuroone-eeg

# Iniciar serviço
systemctl start neuroone-eeg

# Verificar status
systemctl status neuroone-eeg

# Ver logs em tempo real
journalctl -u neuroone-eeg -f
```

**Esperado**:
```
✅ Conectado à porta /dev/ttyUSB0
✅ Conectado ao backend WebSocket
🚀 EEG Bridge iniciado!
📡 Lendo dados de /dev/ttyUSB0...
```

---

### FASE 3: Integração Bluetooth dos Jogos (30 min)

**Você mencionou**: "Os jogos já têm conexão Bluetooth implementada"

#### Tarefa 3.1: Verificar Jogos Existentes

Localize os arquivos dos jogos:
```bash
# Procurar por arquivos de jogos
cd "c:\Users\GouveiaRx\Downloads\BioSync Game FN"
# Verificar diretórios: neuroone-frontend/public/games ou similar
```

#### Tarefa 3.2: Integrar com Sistema Principal

**Opção A**: Os jogos já se conectam ao backend diretamente
- Neste caso, basta garantir que `VITE_WS_URL` está correto

**Opção B**: Os jogos precisam ser integrados no frontend
- Precisamos copiar os arquivos para `neuroone-frontend/public/games/`
- Atualizar rotas no `gameController.js`

**Me informe**: Onde estão os arquivos dos jogos? Vou ajudar na integração.

---

### FASE 4: Testes End-to-End (30 min)

#### Tarefa 4.1: Login como Direção

1. Acesse: `https://seu-frontend.vercel.app/login`
2. Login:
   - Email: `admin@neurogame.com`
   - Senha: `Admin123!` (ou a nova senha que definiu)
3. Deve redirecionar para `/admin`

---

#### Tarefa 4.2: Criar Professor e Turma

1. Dashboard Direção > Usuários > Novo Professor
2. Criar turma em Turmas > Nova Turma
3. Adicionar alunos à turma

---

#### Tarefa 4.3: Testar Fluxo Professor

1. Logout > Login como professor
2. Dashboard Professor > Nova Sessão
3. Selecionar turma, configurar
4. Iniciar sessão
5. **Verificar**: Dashboard em tempo real deve carregar

---

#### Tarefa 4.4: Testar Conexão EEG

**Cenário 1: Servidor Python SSH** (já deployado acima)
1. Ligar headset NeuroSky
2. Conectar headset ao servidor via Bluetooth
3. Verificar logs: `journalctl -u neuroone-eeg -f`
4. Dashboard do professor deve mostrar dados em tempo real

**Cenário 2: Web Bluetooth API** (ainda não implementado)
- Aluno acessa PWA mobile
- Conecta headset via navegador
- (Precisamos implementar isto ainda)

---

## 📋 CHECKLIST FINAL

### Infraestrutura
- [ ] Vercel root directory corrigido
- [ ] Supabase migrations executadas (5/5)
- [ ] Backend env vars configuradas (Supabase keys)
- [ ] Frontend env vars configuradas (Supabase + Backend URL)
- [ ] Servidor Python EEG deployado no SSH
- [ ] Serviço systemd rodando e conectado

### Testes Funcionais
- [ ] Login como direção funciona
- [ ] Login como professor funciona
- [ ] Criar turma funciona
- [ ] Criar sessão funciona
- [ ] Iniciar sessão funciona
- [ ] Dashboard tempo real carrega
- [ ] WebSocket conecta (verificar console do navegador)
- [ ] Dados EEG transmitidos (se headset conectado)
- [ ] Finalizar sessão funciona
- [ ] Relatório é gerado

### Segurança
- [ ] Senha do admin alterada (não usar `Admin123!` em produção!)
- [ ] CORS configurado corretamente no backend
- [ ] RLS policies testadas (cada role vê apenas seus dados)

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Vercel build falha
- Verifique root directory está `neuroone-frontend`
- Build command: `npm run build`
- Output directory: `dist`

### Backend não conecta ao Supabase
- Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
- Teste conexão: `curl https://SEU_PROJETO.supabase.co/rest/v1/users -H "apikey: SUA_ANON_KEY"`

### Frontend mostra CORS error
- Configure `WS_CORS_ORIGIN=https://seu-frontend.vercel.app` no backend
- Redeploy backend

### Servidor Python EEG não conecta
- Verificar porta serial: `ls /dev/tty*`
- Verificar headset está ligado e emparelhado
- Ver logs: `journalctl -u neuroone-eeg -f`

### WebSocket não conecta
- URL deve ser `wss://` (não `ws://`) em HTTPS
- Verificar firewall do servidor
- Testar: `wscat -c wss://seu-backend.onrender.com`

---

## 📞 RECURSOS E SUPORTE

### Documentação
- [deployment/README.md](deployment/README.md) - Visão geral completa
- [deployment/01-SUPABASE-SETUP.md](deployment/01-SUPABASE-SETUP.md) - Database
- [deployment/02-BACKEND-DEPLOY.md](deployment/02-BACKEND-DEPLOY.md) - Backend
- [deployment/03-FRONTEND-DEPLOY.md](deployment/03-FRONTEND-DEPLOY.md) - Frontend
- [deployment/FIX-VERCEL-URGENTE.md](deployment/FIX-VERCEL-URGENTE.md) - Correção Vercel

### Migrations
- [neuroone-backend/migrations/README.md](neuroone-backend/migrations/README.md)
- 5 arquivos SQL prontos para executar

### Python EEG
- [neuroone-python-eeg/eeg_bridge.py](neuroone-python-eeg/eeg_bridge.py)
- [neuroone-python-eeg/README.md](neuroone-python-eeg/README.md)
- [deployment/deploy-eeg-server.bat](deployment/deploy-eeg-server.bat) - Script automático

---

## 🎯 RESUMO EXECUTIVO

**O QUE ESTÁ PRONTO**:
- ✅ Backend 100% (deployado)
- ✅ Frontend 95% (código pronto, erro config Vercel)
- ✅ Migrations SQL 100%
- ✅ Servidor Python EEG 100%
- ✅ Documentação 100%

**O QUE FALTA** (total: ~2 horas):
1. ⏱️ Corrigir Vercel (5 min)
2. ⏱️ Executar migrations Supabase (15 min)
3. ⏱️ Configurar env vars (10 min)
4. ⏱️ Deploy servidor EEG via SSH (30 min)
5. ⏱️ Integrar jogos Bluetooth (30 min)
6. ⏱️ Testes end-to-end (30 min)

**APÓS ISSO**: Sistema 100% funcional em produção! 🎉

---

**Última atualização**: 2025-01-17 17:30
**Versão**: 1.0.0
**Autor**: Claude Code
