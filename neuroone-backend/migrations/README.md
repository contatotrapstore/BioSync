# NeuroOne Database Migrations

Este diretório contém as migrations SQL para configuração do banco de dados PostgreSQL no Supabase.

## 📋 Ordem de Execução

As migrations devem ser executadas **na ordem numérica**:

1. **001_initial_schema.sql** - Schema inicial (tabelas principais)
2. **002_performance_indexes.sql** - Índices de performance
3. **003_lgpd_privacy_tables.sql** - Tabelas de privacidade LGPD
4. **004_enable_rls.sql** - Row Level Security policies
5. **005_seed_data.sql** - Dados iniciais e configurações padrão

## 🚀 Como Executar no Supabase

### Método 1: Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Navegue até **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo de cada migration (na ordem)
6. Clique em **Run** para executar
7. Aguarde a mensagem de sucesso no console
8. Repita para todas as migrations

### Método 2: Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não instalado)
npm install -g supabase

# Fazer login
supabase login

# Conectar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migrations manualmente
supabase db push --file migrations/001_initial_schema.sql
supabase db push --file migrations/002_performance_indexes.sql
supabase db push --file migrations/003_lgpd_privacy_tables.sql
supabase db push --file migrations/004_enable_rls.sql
supabase db push --file migrations/005_seed_data.sql
```

### Método 3: Script Automático

```bash
# No diretório neuroone-backend
node scripts/run-migrations.js
```

## 📊 Detalhes das Migrations

### 001_initial_schema.sql
**Descrição**: Cria todas as tabelas principais do sistema

**Tabelas criadas**:
- `users` - Usuários (direção, professor, aluno)
- `classes` - Turmas
- `class_students` - Relação aluno-turma
- `sessions` - Sessões de aula
- `session_participants` - Participantes de sessão
- `eeg_data` - Dados brutos de EEG
- `session_metrics` - Métricas agregadas de sessão
- `student_metrics` - Métricas individuais de alunos
- `launcher_sessions` - Rastreamento de uso do launcher
- `system_settings` - Configurações globais

**Extensões habilitadas**:
- `uuid-ossp` - Geração de UUIDs

**Triggers criados**:
- Auto-atualização de `updated_at` em todas as tabelas

---

### 002_performance_indexes.sql
**Descrição**: Adiciona índices para otimização de queries

**Índices criados** (18 total):
- **6 Composite Indexes**: Para filtros comuns (teacher+status, class+status, etc.)
- **3 Partial Indexes**: Apenas para registros ativos
- **3 Text Search Indexes (GIN)**: Busca fuzzy em nomes com `pg_trgm`
- **3 JSONB Indexes (GIN)**: Para queries em campos JSONB
- **2 Covering Indexes**: Incluem colunas extras para evitar table lookups
- **1 Extension**: `pg_trgm` para busca de texto

**Comandos de manutenção**:
- `ANALYZE` em todas as tabelas para atualizar estatísticas do query planner

---

### 003_lgpd_privacy_tables.sql
**Descrição**: Tabelas para compliance com LGPD (Lei 13.709/2018)

**Tabelas criadas**:
- `privacy_consents` - Registro de consentimentos
- `account_deletion_requests` - Solicitações de exclusão de dados
- `data_access_logs` - Auditoria de acesso a dados

**Funções criadas**:
- `has_valid_consent(user_id)` - Verifica se usuário tem consentimento válido
- `anonymize_user_data(user_id)` - Anonimiza dados de usuário

**Políticas RLS**:
- Usuários podem apenas acessar seus próprios dados de privacidade
- Direção pode acessar tudo para auditorias

---

### 004_enable_rls.sql
**Descrição**: Habilita Row Level Security e cria políticas de acesso

**RLS habilitado em**: 13 tabelas

**Políticas criadas** (60+ total):
- **Hierarquia de roles**: direção > professor > aluno
- **Direção**: Acesso total a tudo
- **Professor**: Acesso apenas às suas turmas/sessões
- **Aluno**: Acesso apenas aos seus próprios dados

**Funções helper**:
- `get_user_role()` - Retorna role do usuário atual
- `is_direction()` - Verifica se é direção
- `is_professor()` - Verifica se é professor
- `is_student()` - Verifica se é aluno

**Principais políticas**:
- `users`: Direção vê todos, professores veem seus alunos, alunos veem apenas si mesmos
- `eeg_data`: Alunos veem apenas seus dados, professores veem dados de suas sessões
- `sessions`: Professores gerenciam apenas suas sessões
- `privacy_consents`: Usuários acessam apenas seus próprios consentimentos

---

### 005_seed_data.sql
**Descrição**: Insere dados iniciais necessários para operação do sistema

**Dados inseridos**:
- **1 usuário admin** padrão:
  - Email: `admin@neurogame.com`
  - Senha: `Admin123!` ⚠️ **MUDAR EM PRODUÇÃO!**
  - Role: `direção`

- **24 configurações do sistema**:
  - Session defaults (duração, thresholds)
  - EEG device settings (qualidade de sinal, sampling rate)
  - WebSocket settings (heartbeat, reconnect)
  - LGPD/Privacy (versão de consentimento, retenção de dados)
  - Notifications (alertas, lembretes)
  - UI/UX (tema, idioma, refresh interval)
  - Reports (período padrão, exports)
  - Games (launcher, jogos disponíveis)

- **1 privacy consent** para admin

**Dados de demonstração** (comentados):
- Professor demo
- 3 alunos demo
- 1 turma demo
- Matrículas demo

## ✅ Verificação de Sucesso

Após executar todas as migrations, verifique:

```sql
-- Verificar tabelas criadas (deve retornar 13)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar índices criados (deve retornar 18+)
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';

-- Verificar RLS habilitado (deve retornar 13)
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verificar admin criado
SELECT email, name, user_role FROM users
WHERE email = 'admin@neurogame.com';

-- Verificar configurações inseridas (deve retornar 24)
SELECT COUNT(*) FROM system_settings;
```

## 🔐 Segurança Pós-Migration

**IMPORTANTE**: Após executar as migrations em produção:

1. ✅ **Alterar senha do admin**:
   ```sql
   UPDATE users
   SET password_hash = 'SEU_NOVO_HASH_BCRYPT'
   WHERE email = 'admin@neurogame.com';
   ```

2. ✅ **Configurar variáveis de ambiente no backend**:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_KEY=eyJ... # Para bypass RLS no backend
   ```

3. ✅ **Testar RLS policies**:
   - Fazer login como cada tipo de usuário (direção, professor, aluno)
   - Verificar que cada role vê apenas os dados permitidos

4. ✅ **Habilitar backups automáticos** no Supabase Dashboard

5. ✅ **Configurar autenticação JWT** no backend

## 🛠️ Troubleshooting

### Erro: "extension uuid-ossp does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "function auth.uid() does not exist"
- Supabase Auth não está habilitado
- Solução: Habilitar Auth no Supabase Dashboard

### Erro: "permission denied for table users"
- RLS está bloqueando acesso
- Solução: Use Service Role Key no backend para bypass RLS

### Migration já executada (erro de duplicação)
- Todas as migrations usam `IF NOT EXISTS` e `ON CONFLICT DO NOTHING`
- Seguro executar múltiplas vezes (idempotente)

## 📝 Rollback

Para reverter migrations (⚠️ **cuidado em produção!**):

```sql
-- Remover seed data
DELETE FROM privacy_consents WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM system_settings;
DELETE FROM users WHERE email = 'admin@neurogame.com';

-- Desabilitar RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... (repetir para todas as tabelas)

-- Remover tabelas LGPD
DROP TABLE IF EXISTS data_access_logs CASCADE;
DROP TABLE IF EXISTS account_deletion_requests CASCADE;
DROP TABLE IF EXISTS privacy_consents CASCADE;

-- Remover índices
DROP INDEX IF EXISTS idx_sessions_teacher_status;
-- ... (repetir para todos os índices)

-- Remover todas as tabelas principais
DROP TABLE IF EXISTS launcher_sessions CASCADE;
DROP TABLE IF EXISTS student_metrics CASCADE;
DROP TABLE IF EXISTS session_metrics CASCADE;
DROP TABLE IF EXISTS eeg_data CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Remover extensões
DROP EXTENSION IF EXISTS pg_trgm;
DROP EXTENSION IF EXISTS "uuid-ossp";
```

## 📚 Recursos

- [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

## 📞 Suporte

Para dúvidas ou problemas com as migrations, consulte:
- Documentação do projeto em `docs/`
- Issues no repositório
- Logs de execução no Supabase Dashboard
