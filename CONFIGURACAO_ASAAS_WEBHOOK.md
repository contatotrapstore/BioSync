# 🔔 Configuração do Webhook Asaas - NeuroOne

## 📋 Instruções Passo a Passo

### 1. Acessar Dashboard Asaas

Acesse: **https://www.asaas.com/webhooks**

### 2. Adicionar Novo Webhook

Clique em **"Adicionar Webhook"** ou **"Novo Webhook"**

### 3. Configurar URL do Webhook

**URL do Webhook:**
```
https://NeuroOne-backend.onrender.com/api/v1/webhooks/asaas
```

**Nota:** Substitua `NeuroOne-backend.onrender.com` pela URL real do seu backend no Render.

### 4. Selecionar Eventos

Marque os seguintes eventos:

✅ **PAYMENT_CREATED** - Quando um pagamento é criado
✅ **PAYMENT_RECEIVED** - Quando o pagamento é recebido (PIX)
✅ **PAYMENT_CONFIRMED** - Quando o pagamento é confirmado (Cartão)
✅ **PAYMENT_OVERDUE** - Quando o pagamento está vencido
✅ **PAYMENT_DELETED** - Quando o pagamento é deletado
✅ **PAYMENT_REFUNDED** - Quando o pagamento é reembolsado

### 5. Configurar Segurança (Opcional mas Recomendado)

Se o Asaas oferecer um campo de **Secret/Token**, use o mesmo valor configurado no backend `.env`:
```
ASAAS_WEBHOOK_SECRET=<seu_secret_aqui>
```

**Importante:** Este secret deve ser o mesmo em ambos os lugares (Asaas Dashboard e .env do backend)

### 6. Salvar Configuração

Clique em **"Salvar"** ou **"Criar Webhook"**

---

## ✅ Verificar se o Webhook Está Funcionando

### Teste Manual via Logs

1. Crie um pagamento de teste no sistema NeuroOne (launcher)
2. Monitore os logs do backend em: https://dashboard.render.com
3. Procure por mensagens como:
   ```
   [Webhook Asaas] Evento recebido: PAYMENT_CREATED
   [Webhook] Pagamento criado: pay_xxxxx
   [Webhook] Pagamento confirmado: pay_xxxxx
   ```

### Teste no Dashboard Asaas

1. Acesse **Webhooks** no Asaas
2. Veja o histórico de chamadas
3. Verifique se há erros (status 4xx ou 5xx)
4. Status 200 = sucesso ✅

---

## 🔍 Troubleshooting

### Webhook retornando erro 401/403
- Verifique se o `ASAAS_WEBHOOK_SECRET` está correto no `.env`
- Certifique-se de que o backend está validando o secret corretamente

### Webhook retornando erro 500
- Verifique os logs do backend no Render
- Confirme se as tabelas `payments` e `subscriptions` foram criadas no Supabase

### Webhook não está sendo chamado
- Confirme se a URL está acessível publicamente
- Teste com: `curl https://neurogame-7av9.onrender.com/api/v1/health`
- Verifique se os eventos estão marcados corretamente

---

## 📝 Informações de Referência

**Backend URL:** `<sua-url-backend>.onrender.com`
**Webhook Endpoint:** `/api/v1/webhooks/asaas`
**Ambiente:** Verifique `ASAAS_ENVIRONMENT` no `.env` (sandbox ou production)
**API Key:** Configurada no `.env` (ASAAS_API_KEY)

---

## 🔧 Diferenças entre PIX e Cartão

### PIX (Pagamento Único Mensal)
- Cada mês cria um novo **pagamento** no Asaas
- Usuário recebe QR Code para escanear
- Webhook `PAYMENT_RECEIVED` ativa a assinatura
- Campo usado no banco: `asaas_payment_id`

### Cartão de Crédito (Assinatura Recorrente)
- Cria uma **assinatura** no Asaas
- Cobrança automática todo mês
- Webhook `PAYMENT_CONFIRMED` ativa a assinatura
- Campo usado no banco: `asaas_subscription_id`

---

✅ **Configuração concluída!** O sistema agora receberá notificações automáticas de pagamentos do Asaas.

