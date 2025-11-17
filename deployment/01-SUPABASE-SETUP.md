# Guia de Configuração: Supabase Database

Este guia detalha o processo completo de configuração do banco de dados PostgreSQL no Supabase para o projeto NeuroOne.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita ou paga)
- Acesso ao código-fonte do projeto NeuroOne
- Navegador web moderno

## 🚀 Passo 1: Criar Projeto no Supabase

### 1.1 Acessar Dashboard

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login com sua conta (ou crie uma nova)
3. Clique em **"New Project"**

### 1.2 Configurar Projeto

Preencha os campos:

- **Name**: `neuroone-production` (ou nome de sua preferência)
- **Database Password**: Gere uma senha forte (guarde em local seguro!)
- **Region**: Escolha a região mais próxima do Brasil:
  - Recomendado: `South America (São Paulo)` (se disponível)
  - Alternativa: `us-east-1` (N. Virginia)
- **Pricing Plan**:
  - Para testes: **Free** (500MB database, 2GB bandwidth/mês)
  - Para produção: **Pro** ($25/mês) ou superior

Clique em **"Create new project"** e aguarde 1-2 minutos para provisioning.

### 1.3 Anotar Credenciais

Após criação, você verá no **Project Settings > API**:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: Guarde estas credenciais em segurança! Você precisará delas mais tarde.

## 🗄️ Passo 2: Executar Migrations

### 2.1 Acessar SQL Editor

1. No menu lateral do Supabase, clique em **"SQL Editor"**
2. Clique em **"New query"**

### 2.2 Executar Migration 001 - Schema Inicial

1. Abra o arquivo `neuroone-backend/migrations/001_initial_schema.sql`
2. Copie **todo o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl/Cmd + Enter`)
5. Aguarde a execução (15-30 segundos)
6. Verifique a mensagem de sucesso no console inferior:
   ```
   NOTICE:  Migration 001_initial_schema.sql completed successfully!
   NOTICE:  Created 10 tables: users, classes, sessions, eeg_data, ...
   ```

### 2.3 Executar Migration 002 - Performance Indexes

1. Crie uma **nova query** (clique em "+" ou "New query")
2. Abra `neuroone-backend/migrations/002_performance_indexes.sql`
3. Copie e cole todo o conteúdo
4. Clique em **"Run"**
5. Aguarde (30-60 segundos - criação de índices pode demorar)
6. Verifique mensagem de sucesso:
   ```
   NOTICE:  Migration 002_performance_indexes.sql completed successfully!
   NOTICE:  Added 18 performance indexes
   ```

### 2.4 Executar Migration 003 - LGPD Tables

1. Nova query
2. Abra `neuroone-backend/migrations/003_lgpd_privacy_tables.sql`
3. Copie, cole e execute
4. Verifique mensagem:
   ```
   NOTICE:  Migration 003_lgpd_privacy_tables.sql completed successfully!
   ```

### 2.5 Executar Migration 004 - Row Level Security

1. Nova query
2. Abra `neuroone-backend/migrations/004_enable_rls.sql`
3. Copie, cole e execute
4. Aguarde (pode demorar 60-90 segundos - muitas policies)
5. Verifique mensagem:
   ```
   NOTICE:  Migration 004_enable_rls.sql completed successfully!
   NOTICE:  Enabled RLS on 13 tables with 60+ security policies
   ```

### 2.6 Executar Migration 005 - Seed Data

1. Nova query
2. Abra `neuroone-backend/migrations/005_seed_data.sql`
3. Copie, cole e execute
4. Verifique mensagem:
   ```
   NOTICE:  ✓ 1 admin user (admin@neurogame.com / Admin123!)
   NOTICE:  ✓ 24 system settings
   NOTICE:  ⚠️  Change admin password immediately in production!
   ```

## ✅ Passo 3: Verificar Instalação

Execute as queries abaixo para validar que tudo foi criado corretamente:

### 3.1 Verificar Tabelas (deve retornar 13)

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
```

Resultado esperado: `13`

### 3.2 Verificar Índices (deve retornar 18+)

```sql
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';
```

Resultado esperado: `18` ou mais

### 3.3 Verificar RLS Habilitado (deve retornar 13)

```sql
SELECT COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

Resultado esperado: `13`

### 3.4 Verificar Admin Criado

```sql
SELECT email, name, user_role, active
FROM users
WHERE email = 'admin@neurogame.com';
```

Resultado esperado:
```
email                | name                    | user_role | active
---------------------|-------------------------|-----------|-------
admin@neurogame.com  | Administrador Sistema   | direção   | true
```

### 3.5 Verificar System Settings (deve retornar 24)

```sql
SELECT COUNT(*) as total_settings
FROM system_settings;
```

Resultado esperado: `24`

## 🔐 Passo 4: Configuração de Segurança

### 4.1 Alterar Senha do Admin (OBRIGATÓRIO!)

⚠️ **CRÍTICO**: A senha padrão `Admin123!` deve ser alterada imediatamente!

1. Gere um novo hash bcrypt com sua senha:
   ```javascript
   // Node.js
   const bcrypt = require('bcrypt');
   const newPassword = 'SuaSenhaForteAqui!2025';
   const hash = await bcrypt.hash(newPassword, 10);
   console.log(hash);
   ```

2. Ou use o próprio backend (após deploy) para atualizar:
   ```bash
   curl -X PUT https://seu-backend.com/api/users/00000000-0000-0000-0000-000000000001 \
     -H "Content-Type: application/json" \
     -d '{"password": "SuaSenhaForteAqui!2025"}'
   ```

3. Ou atualize diretamente no SQL (temporário):
   ```sql
   UPDATE users
   SET password_hash = '$2b$10$SEU_NOVO_HASH_AQUI'
   WHERE email = 'admin@neurogame.com';
   ```

### 4.2 Configurar Autenticação (Opcional - se usar Supabase Auth)

Se você optar por usar Supabase Auth em vez de autenticação custom:

1. Vá em **Authentication > Providers**
2. Habilite **Email** provider
3. Configure **Email Templates** (boas-vindas, recuperação de senha)
4. Ajuste **URL Configuration**:
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/auth/callback`

### 4.3 Habilitar Realtime (Opcional)

Para updates em tempo real via WebSocket do Supabase:

1. Vá em **Database > Replication**
2. Habilite replication para as tabelas desejadas:
   - `sessions` (para monitorar status de sessões)
   - `eeg_data` (se quiser usar Supabase Realtime)

⚠️ **Nota**: O projeto usa Socket.io próprio, então Supabase Realtime é opcional.

## 🌍 Passo 5: Configurar Variáveis de Ambiente

### 5.1 Obter Credenciais

No **Project Settings > API**, copie:

1. **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
2. **anon/public key**: `eyJhbG...` (chave pública, pode expor no frontend)
3. **service_role key**: `eyJhbG...` (chave privada, NUNCA expor!)

### 5.2 Configurar Backend (.env)

Crie/atualize `neuroone-backend/.env`:

```env
# Database
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# Backend API
PORT=3001
NODE_ENV=production

# JWT (para autenticação própria do backend)
JWT_SECRET=sua-chave-secreta-aqui-minimo-32-caracteres
JWT_EXPIRATION=24h

# WebSocket
WS_PORT=3002
WS_CORS_ORIGIN=https://seu-frontend.vercel.app

# LGPD
LGPD_CONSENT_VERSION=1.0.0
DATA_RETENTION_YEARS=5
```

### 5.3 Configurar Frontend (.env)

Crie/atualize `neuroone-frontend/.env`:

```env
# Supabase (apenas anon key - seguro expor)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# Backend API
VITE_API_URL=https://seu-backend-railway.up.railway.app
VITE_WS_URL=wss://seu-backend-railway.up.railway.app
```

## 🔍 Passo 6: Testar Conexão

### 6.1 Teste via SQL Editor

Execute uma query simples para testar:

```sql
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM classes) as total_classes,
  (SELECT COUNT(*) FROM sessions) as total_sessions,
  (SELECT COUNT(*) FROM system_settings) as total_settings;
```

### 6.2 Teste via Backend (após deploy)

```bash
# Testar health check
curl https://seu-backend.com/health

# Testar conexão com DB
curl https://seu-backend.com/api/users
```

### 6.3 Teste RLS Policies

Crie um usuário teste e valide que RLS está funcionando:

```sql
-- Criar usuário professor teste
INSERT INTO users (email, name, user_role, password_hash)
VALUES ('professor@teste.com', 'Prof Teste', 'professor', '$2b$10$hash');

-- Tentar acessar como esse usuário
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<UUID_DO_PROFESSOR>"}';

-- Deve retornar apenas dados permitidos ao professor
SELECT * FROM classes;
```

## 📊 Passo 7: Monitoramento e Backups

### 7.1 Habilitar Backups Automáticos

1. Vá em **Database > Backups**
2. Configure:
   - **Daily Backups**: Habilitado
   - **Retention**: 7 dias (Free) ou 30 dias (Pro)
   - **Point-in-Time Recovery (PITR)**: Apenas Pro plan

### 7.2 Configurar Alertas

1. Vá em **Project Settings > Notifications**
2. Habilite alertas para:
   - Database size > 80% do limite
   - API usage > 80% do limite
   - Erros frequentes (rate > 10/min)

### 7.3 Monitorar Logs

- **Logs**: **Database > Logs** (Postgres logs)
- **API Logs**: **Edge Functions > Logs**
- **Auth Logs**: **Authentication > Logs**

## 🛠️ Troubleshooting

### Problema: "permission denied for table users"

**Causa**: RLS está bloqueando acesso.

**Solução**:
- Use **Service Role Key** no backend (bypass RLS)
- Verifique se policies foram criadas corretamente (migration 004)

### Problema: "function auth.uid() does not exist"

**Causa**: Supabase Auth não foi inicializado corretamente.

**Solução**:
```sql
-- Verificar se auth schema existe
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';

-- Se não existir, contactar suporte Supabase
```

### Problema: Queries lentas

**Solução**:
1. Verifique se índices foram criados (migration 002)
2. Execute `ANALYZE` nas tabelas:
   ```sql
   ANALYZE users;
   ANALYZE sessions;
   ANALYZE eeg_data;
   ```
3. Use **Database > Query Performance** para identificar queries lentas

### Problema: "extension uuid-ossp does not exist"

**Solução**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 📚 Recursos Adicionais

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)

## ✅ Checklist Final

Antes de prosseguir para o deploy do backend/frontend:

- [ ] Projeto Supabase criado
- [ ] Todas as 5 migrations executadas com sucesso
- [ ] 13 tabelas criadas
- [ ] 18+ índices criados
- [ ] RLS habilitado em 13 tabelas
- [ ] Admin user criado
- [ ] 24 system settings inseridos
- [ ] **Senha do admin alterada**
- [ ] Credenciais anotadas (URL, anon key, service key)
- [ ] Variáveis de ambiente configuradas (.env backend e frontend)
- [ ] Backups automáticos habilitados
- [ ] Testes de conexão executados

## 🎯 Próximos Passos

Após concluir este guia, prossiga para:

1. **[02-BACKEND-DEPLOY.md](02-BACKEND-DEPLOY.md)** - Deploy do backend Node.js no Railway ou Render
2. **[03-FRONTEND-DEPLOY.md](03-FRONTEND-DEPLOY.md)** - Deploy do frontend React no Vercel

---

**Última atualização**: 2025-01-17
**Versão**: 1.0.0
**Autor**: Claude Code
