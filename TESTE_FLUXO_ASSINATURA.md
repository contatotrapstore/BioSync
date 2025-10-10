# 🧪 Guia de Teste - Fluxo de Assinatura BioSync

## 📋 Pré-requisitos

1. ✅ Backend rodando no Render
2. ✅ Webhook do Asaas configurado
3. ✅ Migração SQL executada (campo `asaas_payment_id` adicionado)
4. ✅ Variáveis de ambiente configuradas:
   - `ASAAS_API_KEY`
   - `ASAAS_WEBHOOK_SECRET`
   - `ASAAS_ENVIRONMENT` (sandbox ou production)
   - `SUBSCRIPTION_VALUE` (padrão: 149.90)

---

## 🔧 1. Executar Migração SQL

Antes de testar, execute a migração no Supabase:

1. Acesse: https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp/editor
2. Abra o SQL Editor
3. Execute o arquivo: `biosync-backend/migrations/add_asaas_payment_id.sql`
4. Verifique se a coluna foi criada:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'subscriptions'
   AND column_name = 'asaas_payment_id';
   ```

---

## 💳 2. Teste de Assinatura com PIX

### 2.1. Criar Conta no Launcher

1. Abra o launcher BioSync
2. Crie uma nova conta de teste:
   - Email: `teste.pix@biosync.com`
   - Senha: `Teste123!`
   - Nome completo: `Teste PIX Usuario`

### 2.2. Iniciar Assinatura com PIX

1. Faça login no launcher
2. Clique em "Assinar" ou "Gerenciar Assinatura"
3. Selecione método: **PIX**
4. Clique em "Continuar"

### 2.3. Verificar Resposta da API

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Pagamento criado! Escaneie o QR Code para pagar",
  "data": {
    "subscription": {
      "id": "uuid-da-subscription",
      "status": "pending",
      "plan_value": 149.90,
      "payment_method": "PIX",
      "next_due_date": "2025-01-11"
    },
    "payment": {
      "pixQrCode": "data:image/png;base64,...",
      "pixCopyPaste": "00020101021226...",
      "expiresIn": "1 hora"
    }
  }
}
```

### 2.4. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Verificar subscription criada
SELECT
  id,
  user_id,
  asaas_payment_id,
  asaas_subscription_id,
  status,
  payment_method,
  plan_value
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE email = 'teste.pix@biosync.com')
ORDER BY created_at DESC
LIMIT 1;

-- Verificar payment registrado
SELECT
  id,
  asaas_payment_id,
  value,
  status,
  payment_method,
  due_date
FROM payments
WHERE subscription_id = (
  SELECT id FROM subscriptions
  WHERE user_id = (SELECT id FROM users WHERE email = 'teste.pix@biosync.com')
  ORDER BY created_at DESC
  LIMIT 1
);
```

**Resultado esperado:**
- `subscriptions.asaas_payment_id`: deve ter valor (ex: `pay_xxxxx`)
- `subscriptions.asaas_subscription_id`: deve ser NULL
- `subscriptions.status`: `pending`
- `subscriptions.payment_method`: `PIX`

### 2.5. Simular Pagamento PIX (Sandbox)

**Ambiente Sandbox Asaas:**
1. Acesse: https://sandbox.asaas.com/payments
2. Encontre o pagamento criado
3. Clique em "Confirmar Pagamento" (simula pagamento)

**Ou via API:**
```bash
curl -X POST https://sandbox.asaas.com/api/v3/payments/{payment_id}/receiveInCash \
  -H "access_token: $ASAAS_API_KEY"
```

### 2.6. Verificar Webhook

Monitore os logs do backend no Render:

```
[Webhook Asaas] Evento recebido: PAYMENT_RECEIVED
[Webhook] Pagamento confirmado: pay_xxxxx
[Webhook] Subscription xxxxx ativada!
```

### 2.7. Verificar Ativação da Assinatura

```sql
SELECT
  id,
  status,
  started_at,
  last_payment_date,
  last_payment_status
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE email = 'teste.pix@biosync.com')
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado após webhook:**
- `status`: `active`
- `started_at`: timestamp atual
- `last_payment_date`: timestamp atual
- `last_payment_status`: `received`

---

## 💳 3. Teste de Assinatura com Cartão de Crédito

### 3.1. Criar Conta no Launcher

1. Abra o launcher BioSync
2. Crie uma nova conta de teste:
   - Email: `teste.cartao@biosync.com`
   - Senha: `Teste123!`
   - Nome completo: `Teste Cartão Usuario`

### 3.2. Iniciar Assinatura com Cartão

1. Faça login no launcher
2. Clique em "Assinar"
3. Selecione método: **Cartão de Crédito**
4. Preencha os dados do cartão de teste (Asaas Sandbox):
   - **Número:** 5162306219378829
   - **Titular:** Teste Usuario
   - **Validade:** 12/2030
   - **CVV:** 318
   - **CPF do titular:** 12345678909
   - **CEP:** 89223-005
   - **Número:** 277
   - **Telefone:** (47) 99999-9999

### 3.3. Verificar Resposta da API

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Assinatura criada com sucesso",
  "data": {
    "subscription": {
      "id": "uuid-da-subscription",
      "status": "pending",
      "plan_value": 149.90,
      "payment_method": "CREDIT_CARD",
      "next_due_date": "2025-02-10"
    },
    "payment": {
      "status": "CONFIRMED",
      "invoiceUrl": "https://..."
    }
  }
}
```

### 3.4. Verificar no Banco de Dados

```sql
SELECT
  id,
  user_id,
  asaas_payment_id,
  asaas_subscription_id,
  status,
  payment_method,
  plan_value
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE email = 'teste.cartao@biosync.com')
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- `subscriptions.asaas_payment_id`: NULL
- `subscriptions.asaas_subscription_id`: deve ter valor (ex: `sub_xxxxx`)
- `subscriptions.status`: `pending` (inicial), depois `active` (após webhook)
- `subscriptions.payment_method`: `CREDIT_CARD`

### 3.5. Verificar Webhook de Confirmação

Logs esperados:

```
[Webhook Asaas] Evento recebido: PAYMENT_CONFIRMED
[Webhook] Pagamento confirmado: pay_xxxxx
[Webhook] Subscription xxxxx ativada!
```

---

## ❌ 4. Testes de Erro

### 4.1. Cartão Inválido

Use o cartão de teste que sempre falha:
- **Número:** 4000000000000002

**Resposta esperada:**
```json
{
  "success": false,
  "message": "Cartão inválido ou recusado"
}
```

### 4.2. Dados Incompletos

Envie requisição sem dados de cartão:

```json
{
  "paymentMethod": "CREDIT_CARD"
  // creditCard e creditCardHolder faltando
}
```

**Resposta esperada:**
```json
{
  "success": false,
  "message": "Dados do cartão e titular são obrigatórios para pagamento com cartão"
}
```

### 4.3. Usuário com Assinatura Ativa

Tente criar segunda assinatura para mesmo usuário:

**Resposta esperada:**
```json
{
  "success": false,
  "message": "Você já possui uma assinatura ativa"
}
```

---

## 📊 5. Checklist de Validação

### Backend
- [ ] Endpoint `/api/v1/subscriptions/create` responde corretamente
- [ ] PIX gera QR Code válido
- [ ] Cartão processa pagamento
- [ ] Erros retornam mensagens claras
- [ ] Logs mostram todas as etapas

### Banco de Dados
- [ ] Campo `asaas_payment_id` existe na tabela `subscriptions`
- [ ] PIX preenche `asaas_payment_id`
- [ ] Cartão preenche `asaas_subscription_id`
- [ ] Status muda de `pending` para `active` após pagamento

### Webhooks
- [ ] Webhook recebe eventos do Asaas
- [ ] `PAYMENT_RECEIVED` ativa assinatura PIX
- [ ] `PAYMENT_CONFIRMED` ativa assinatura Cartão
- [ ] Logs mostram processamento de webhooks

### Launcher
- [ ] Interface mostra opções PIX e Cartão
- [ ] QR Code PIX é exibido corretamente
- [ ] Formulário de cartão valida campos
- [ ] Mensagens de erro são claras
- [ ] Após pagamento, launcher reconhece assinatura ativa

---

## 🐛 Solução de Problemas

### Erro: "Failed to create customer"
**Causa:** API Key inválida ou ambiente errado
**Solução:**
1. Verifique `ASAAS_API_KEY` no `.env`
2. Confirme `ASAAS_ENVIRONMENT` (sandbox ou production)
3. Teste a API Key manualmente:
   ```bash
   curl https://sandbox.asaas.com/api/v3/customers \
     -H "access_token: $ASAAS_API_KEY"
   ```

### Erro: "Falha ao obter QR Code PIX"
**Causa:** Pagamento não foi criado ou demora na API Asaas
**Solução:**
1. Verifique se o pagamento existe no dashboard Asaas
2. Aguarde alguns segundos e tente novamente
3. Verifique logs do backend para erro específico

### Webhook não chega
**Causa:** URL incorreta ou secret inválido
**Solução:**
1. Verifique URL do webhook no dashboard Asaas
2. Teste webhook manualmente com cURL
3. Verifique `ASAAS_WEBHOOK_SECRET` no `.env`

### Assinatura não ativa após pagamento
**Causa:** Webhook não processou corretamente
**Solução:**
1. Verifique tabela `asaas_webhooks` no Supabase
2. Procure por `processed: false` e `error_message`
3. Reprocesse manualmente se necessário

---

## ✅ Resultado Esperado

Após todos os testes:

1. ✅ PIX cria pagamento único e gera QR Code
2. ✅ Cartão cria assinatura recorrente
3. ✅ Webhooks ativam assinaturas automaticamente
4. ✅ Banco de dados registra corretamente ambos os métodos
5. ✅ Launcher exibe status de assinatura corretamente

---

**Data do teste:** _____/_____/_____
**Testado por:** _________________________
**Ambiente:** [ ] Sandbox [ ] Production
