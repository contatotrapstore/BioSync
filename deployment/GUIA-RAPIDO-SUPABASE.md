# 🚀 Guia Rápido - Executar Migrations no Supabase

**Tempo estimado**: 15 minutos

## Passo 1: Acessar Supabase Dashboard

1. Abra: https://app.supabase.com
2. Faça login com sua conta
3. Se já tem um projeto, selecione-o
4. Se não tem projeto ainda:
   - Clique em **"New Project"**
   - Nome: `NeuroOne Production` (ou o que preferir)
   - Database Password: **Anote esta senha!** (você vai precisar)
   - Region: `South America (São Paulo)` (recomendado para Brasil)
   - Clique em **"Create new project"**
   - Aguarde 2-3 minutos para o projeto ser criado

## Passo 2: Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"** (botão no canto superior direito)

## Passo 3: Executar Migrations (NA ORDEM!)

### Migration 1/5: Schema Inicial

1. Abra o arquivo: `neuroone-backend/migrations/001_initial_schema.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl+Enter`)
5. ✅ Aguarde mensagem: "Success. No rows returned"

**O que essa migration faz**:
- Cria 10 tabelas principais (users, classes, sessions, eeg_data, etc.)
- Define relações entre tabelas (foreign keys)
- Configura constraints de validação

---

### Migration 2/5: Índices de Performance

1. Abra o arquivo: `neuroone-backend/migrations/002_performance_indexes.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor (você pode usar a mesma aba ou criar uma nova query)
4. Clique em **"Run"**
5. ✅ Aguarde: "Success. No rows returned"

**O que essa migration faz**:
- Cria 18 índices para otimizar consultas
- Habilita extensão `pg_trgm` para busca de texto
- Melhora performance de queries em produção

---

### Migration 3/5: Tabelas LGPD

1. Abra: `neuroone-backend/migrations/003_lgpd_privacy_tables.sql`
2. Copie e cole no SQL Editor
3. Clique em **"Run"**
4. ✅ Aguarde: "Success. No rows returned"

**O que essa migration faz**:
- Cria tabelas para compliance LGPD
- `consent_records`: registro de consentimentos
- `data_deletion_requests`: solicitações de exclusão de dados
- `audit_logs`: logs de auditoria

---

### Migration 4/5: Row Level Security (RLS)

1. Abra: `neuroone-backend/migrations/004_enable_rls.sql`
2. Copie e cole no SQL Editor
3. Clique em **"Run"**
4. ✅ Aguarde: "Success. No rows returned"

**O que essa migration faz**:
- Habilita Row Level Security em todas as tabelas
- Cria 60+ políticas de segurança
- Garante que usuários só vejam seus próprios dados
- Direção vê tudo, Professor vê suas turmas, Aluno vê apenas seus dados

**IMPORTANTE**: Esta é a migration mais crítica para segurança!

---

### Migration 5/5: Dados Iniciais (Seed)

1. Abra: `neuroone-backend/migrations/005_seed_data.sql`
2. Copie e cole no SQL Editor
3. Clique em **"Run"**
4. ✅ Aguarde: "Success. No rows returned"

**O que essa migration faz**:
- Cria usuário admin inicial:
  - Email: `admin@neurogame.com`
  - Senha: `Admin123!` ⚠️ **ALTERE IMEDIATAMENTE APÓS PRIMEIRO LOGIN!**
- Insere 24 configurações padrão do sistema
- Cria dados de exemplo (opcional)

---

## Passo 4: Verificar Migrations

1. No menu lateral, clique em **"Database"**
2. Clique em **"Tables"**
3. Você deve ver estas tabelas:

✅ Tabelas principais:
- users
- classes
- class_students
- sessions
- session_students
- eeg_data
- reports
- games

✅ Tabelas LGPD:
- consent_records
- data_deletion_requests
- audit_logs

✅ Tabelas sistema:
- system_settings

**Total**: 12 tabelas

Se todas estão listadas, ✅ **Migrations executadas com sucesso!**

---

## Passo 5: Copiar Credenciais do Supabase

Agora você precisa das credenciais para conectar o backend:

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Você verá:

### URL do Projeto
```
https://xxxxxxxxxxxxx.supabase.co
```
📋 **Copie e salve**: Esta é sua `SUPABASE_URL`

### Anon Key (Public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
```
📋 **Copie e salve**: Esta é sua `SUPABASE_ANON_KEY`

### Service Role Key (Secret)
⚠️ **ATENÇÃO**: Clique em "Reveal" para mostrar

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
```
📋 **Copie e salve**: Esta é sua `SUPABASE_SERVICE_KEY`

⚠️ **NUNCA compartilhe a Service Role Key publicamente!**

---

## Passo 6: Testar Conexão

Vamos testar se tudo está funcionando:

1. No SQL Editor, execute esta query:

```sql
-- Verificar se admin foi criado
SELECT id, email, name, user_role, active
FROM users
WHERE email = 'admin@neurogame.com';
```

✅ **Resultado esperado**:
```
id: 00000000-0000-0000-0000-000000000001
email: admin@neurogame.com
name: Administrador Sistema
user_role: direção
active: true
```

2. Verificar configurações do sistema:

```sql
-- Ver todas as configurações
SELECT key, value, description
FROM system_settings
ORDER BY key;
```

✅ **Resultado esperado**: 24 linhas com configurações

---

## ✅ Checklist Final

Marque conforme completa:

- [ ] Projeto Supabase criado
- [ ] Migration 001 executada (tabelas criadas)
- [ ] Migration 002 executada (índices criados)
- [ ] Migration 003 executada (tabelas LGPD)
- [ ] Migration 004 executada (RLS habilitado)
- [ ] Migration 005 executada (dados seed)
- [ ] Verificado: 12 tabelas criadas
- [ ] Verificado: Usuário admin existe
- [ ] Credenciais copiadas:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_KEY

---

## 🔒 Segurança Pós-Setup

### ⚠️ CRÍTICO - Alterar Senha do Admin

A senha padrão `Admin123!` é temporária. Altere IMEDIATAMENTE:

**Opção A: Via SQL** (agora):
```sql
-- Gerar novo hash bcrypt em: https://bcrypt-generator.com/
-- Use rounds=10 e sua nova senha forte

UPDATE users
SET password_hash = '$2b$10$SEU_NOVO_HASH_AQUI'
WHERE email = 'admin@neurogame.com';
```

**Opção B: Via Interface** (após deploy do frontend):
1. Login com `admin@neurogame.com` / `Admin123!`
2. Ir em Configurações > Alterar Senha
3. Definir nova senha forte

---

## 🎯 Próximos Passos

Após completar todas as migrations:

1. ✅ Supabase está pronto!
2. 📋 Você tem as 3 credenciais anotadas
3. ⏭️ Próximo: Configurar variáveis de ambiente no backend
4. ⏭️ Depois: Configurar variáveis no frontend

### 🎮 Novo em v2.5.0: Jogos Neurofeedback

O sistema agora inclui jogos integrados que funcionam com dados EEG:
- **Fazendinha 3D**: Jogo controlado via níveis de atenção
- **Monitor EEG**: Interface standalone de visualização

Os jogos são servidos pelo backend em `/games` e `/monitor` e **não requerem tabelas adicionais** no Supabase. Consulte [JOGOS.md](../JOGOS.md) para mais detalhes.

**Continue em**: [PROXIMOS-PASSOS.md](../PROXIMOS-PASSOS.md) - Seção "Tarefa 1.3"

---

## 🆘 Troubleshooting

### Erro: "permission denied for schema public"
**Solução**: Execute esta query primeiro:
```sql
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
```

### Erro: "relation already exists"
**Causa**: Migration já foi executada antes
**Solução**: Pule para a próxima migration ou use `DROP TABLE IF EXISTS` antes

### Erro: "function auth.uid() does not exist"
**Causa**: Supabase Auth não está habilitado
**Solução**:
1. Settings > Authentication
2. Enable Authentication
3. Re-executar migration 004

### Migrations executadas parcialmente
**Solução**: Verificar quais tabelas existem:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Compare com a lista esperada e execute apenas as migrations faltantes.

---

**Criado em**: 2025-01-17
**Última atualização**: 2025-11-18 (v2.5.0 - Games Integration)
**Versão**: 1.1.0
**Tempo total**: ~15 minutos
