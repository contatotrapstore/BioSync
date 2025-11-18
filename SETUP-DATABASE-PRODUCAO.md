# 🗄️ Setup do Banco de Dados - NeuroOne (Produção)

## 📋 Instruções para Configurar o Banco de Dados

### 1️⃣ Acesse o Supabase SQL Editor

**URL direta:** https://supabase.com/dashboard/project/fsszpnbuabhhvrdmrtct/sql

Ou navegue manualmente:
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto **NeuroOne** (ID: `fsszpnbuabhhvrdmrtct`)
3. No menu lateral, clique em **SQL Editor**

---

### 2️⃣ Execute o SQL de Migração

Cole e execute o SQL abaixo no **SQL Editor** do Supabase:

```sql
-- =====================================================
-- NEUROONE - MIGRATION PARA PRODUÇÃO
-- =====================================================
-- Adiciona campos teacher_id e subject à tabela classes
-- Data: 2025-11-18
-- =====================================================

-- 1. Adicionar coluna teacher_id (professor responsável pela turma)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Adicionar coluna subject (matéria/disciplina)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS subject TEXT;

-- 3. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

-- 4. Atualizar turmas existentes (opcional - define professor automaticamente)
UPDATE classes
SET teacher_id = created_by
WHERE created_by IN (
  SELECT id FROM users WHERE user_role = 'professor'
)
AND teacher_id IS NULL;

-- 5. Adicionar comentários para documentação
COMMENT ON COLUMN classes.teacher_id IS 'Professor responsável pela turma';
COMMENT ON COLUMN classes.subject IS 'Matéria ou disciplina da turma (ex: Matemática, Português)';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
```

---

### 3️⃣ Verificar se a Migration Foi Aplicada

Execute este SQL para verificar:

```sql
-- Verificar estrutura da tabela classes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;
```

**Resultado esperado:** Você deve ver as colunas `teacher_id` e `subject` na lista.

---

### 4️⃣ Testar Criação de Turma

Execute este teste para garantir que tudo está funcionando:

```sql
-- Inserir turma de teste
INSERT INTO classes (name, school_year, subject, teacher_id, created_by, active)
VALUES (
  'Teste - Matemática 8ºA',
  '2025',
  'Matemática',
  (SELECT id FROM users WHERE user_role = 'professor' LIMIT 1),
  (SELECT id FROM users WHERE user_role = 'direcao' LIMIT 1),
  true
)
RETURNING *;
```

Se retornar um registro completo com `teacher_id` e `subject`, **está tudo OK!** ✅

---

### 5️⃣ Limpar Dados de Teste (Opcional)

Se você executou o teste acima, pode remover a turma de teste:

```sql
-- Remover turma de teste
DELETE FROM classes
WHERE name = 'Teste - Matemática 8ºA';
```

---

## ✅ Checklist de Validação

Marque cada item após executar:

- [ ] SQL de migration executado sem erros
- [ ] Colunas `teacher_id` e `subject` aparecem na verificação
- [ ] Índice `idx_classes_teacher` foi criado
- [ ] Teste de inserção funcionou corretamente
- [ ] Dados de teste foram removidos (se aplicável)
- [ ] Frontend está criando turmas com professor e matéria

---

## 🚀 Próximos Passos

Após executar a migration:

1. **Recarregue a aplicação** no navegador (Ctrl+F5)
2. **Teste criar uma nova turma** via interface
3. **Verifique** se os campos Professor e Matéria aparecem
4. **Confira** se os dados são salvos corretamente

---

## 🆘 Solução de Problemas

### Erro: "column teacher_id already exists"
**Solução:** A coluna já foi adicionada. Pule para a etapa de verificação.

### Erro: "relation classes does not exist"
**Solução:** Execute primeiro a migration inicial `001_initial_schema.sql`.

### Erro ao criar turma no frontend
**Solução:**
1. Abra o console do navegador (F12)
2. Verifique erros de rede ou validação
3. Confira se o backend está rodando (`npm run dev`)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend (`neuroone-backend`)
2. Verifique o console do navegador (F12 → Console)
3. Confirme que o `.env` está configurado corretamente

---

**Última atualização:** 2025-11-18
**Versão do NeuroOne:** 2.5.0
