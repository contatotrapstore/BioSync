# 📋 Instruções de Configuração do Supabase - BioSync

## 🎯 Projeto Supabase
- **Nome:** BioSync
- **ID:** uszmhhukjohjarplnlmp
- **Região:** sa-east-1
- **Host:** db.uszmhhukjohjarplnlmp.supabase.co

## 📝 Passos para Configurar o Banco de Dados

### 1. Acessar o SQL Editor do Supabase
1. Acesse: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp
2. No menu lateral, clique em **SQL Editor**

### 2. Executar o Schema Completo
1. Crie uma nova query
2. Copie todo o conteúdo do arquivo: `biosync-backend/supabase-schema-complete.sql`
3. Cole no SQL Editor
4. Clique em **Run** ou pressione `Ctrl+Enter`
5. Aguarde a execução (pode levar ~30 segundos)

### 3. Inserir Dados Iniciais (Seeds)
1. Após o schema ser criado com sucesso
2. Execute o arquivo: `biosync-backend/supabase-seeds.sql`
3. Isso criará:
   - Usuário admin padrão
   - Catálogo de 13 jogos
   - Planos de assinatura
   - Associações entre planos e jogos

### 4. Obter Credenciais do Projeto

#### a) API URL
- Vá em **Settings** > **API**
- Copie: **Project URL**
- Exemplo: `https://uszmhhukjohjarplnlmp.supabase.co`

#### b) Anon Key (Public)
- Vá em **Settings** > **API**
- Copie: **anon / public key**
- Use no frontend (admin/launcher)

#### c) Service Role Key (Secret)
- Vá em **Settings** > **API**
- Copie: **service_role key**
- ⚠️ **NUNCA** exponha esta chave no frontend
- Use apenas no backend

### 5. Configurar Variáveis de Ambiente

Atualize o arquivo `.env` no backend:

```env
# Supabase Configuration
SUPABASE_URL=https://uszmhhukjohjarplnlmp.supabase.co
SUPABASE_ANON_KEY=eyJ... (sua anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (sua service role key)

# Database Connection
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.uszmhhukjohjarplnlmp.supabase.co:5432/postgres
```

### 6. Verificar Instalação

Execute as queries de teste:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar usuários
SELECT COUNT(*) as total_users FROM users;

-- Verificar jogos
SELECT COUNT(*) as total_games FROM games;

-- Verificar planos
SELECT * FROM subscription_plans;
```

## ✅ Checklist de Verificação

- [ ] Schema executado sem erros
- [ ] 13 tabelas criadas
- [ ] Seeds inseridos (admin, jogos, planos)
- [ ] API URL copiada
- [ ] Anon Key copiada
- [ ] Service Role Key copiada
- [ ] .env atualizado
- [ ] Testes de conexão funcionando

## 🔗 Links Úteis

- **Dashboard:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp
- **SQL Editor:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/sql
- **Configurações API:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/settings/api
- **Tabelas:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/editor

## 📞 Suporte

Em caso de erros:
1. Verifique os logs no SQL Editor
2. Confirme que todas as extensões estão ativadas
3. Verifique se não há conflitos de nomes de tabelas
4. Rode cada seção do schema separadamente se necessário

---

**Status:** 🟢 Pronto para configuração
**Data:** 2025-10-09
