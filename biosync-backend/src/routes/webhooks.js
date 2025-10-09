const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const asaasService = require('../services/asaas');

/**
 * POST /api/v1/webhooks/asaas
 * Processar eventos de webhook do Asaas
 */
router.post('/asaas', async (req, res) => {
  try {
    const event = req.body;

    console.log(`[Webhook Asaas] Evento recebido: ${event.event}`);

    const signature = req.headers['asaas-signature'];
    const rawPayload = req.rawBody || JSON.stringify(event);

    if (!asaasService.validateWebhook(rawPayload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }


    // Salvar webhook no banco para log
    const { data: webhookLog } = await supabase
      .from('asaas_webhooks')
      .insert([{
        event_type: event.event,
        asaas_event_id: event.id,
        payload: event,
        processed: false
      }])
      .select()
      .single();

    // Processar evento
    await processWebhookEvent(event, webhookLog.id);

    // Retornar sucesso imediatamente (Asaas exige resposta rapida)
    res.json({ received: true });
  } catch (error) {
    console.error(`[Webhook Asaas] Erro: ${error.message}`);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * Processar evento de webhook
 */
async function processWebhookEvent(event, webhookId) {
  const eventType = event.event;
  const payment = event.payment;

  try {
    switch (eventType) {
      case 'PAYMENT_CREATED':
        await handlePaymentCreated(payment, webhookId);
        break;

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await handlePaymentConfirmed(payment, webhookId);
        break;

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(payment, webhookId);
        break;

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await handlePaymentDeleted(payment, webhookId);
        break;

      default:
        console.log(`[Webhook] Evento nao tratado: ${eventType}`);
    }

    // Marcar webhook como processado
    await supabase
      .from('asaas_webhooks')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookId);

  } catch (error) {
    console.error(`[Webhook] Erro ao processar ${eventType}: ${error.message}`);

    // Registrar erro no webhook
    await supabase
      .from('asaas_webhooks')
      .update({
        processed: false,
        error_message: error.message
      })
      .eq('id', webhookId);

    throw error;
  }
}

/**
 * Pagamento criado
 */
async function handlePaymentCreated(payment, webhookId) {
  console.log(`[Webhook] Pagamento criado: ${payment.id}`);

  // Buscar subscription pelo asaas_subscription_id
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', payment.subscription)
    .single();

  if (!subscription) {
    console.log('[Webhook] Subscription nao encontrada para payment:', payment.id);
    return;
  }

  // Criar/atualizar payment no banco
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('asaas_payment_id', payment.id)
    .single();

  const paymentData = {
    subscription_id: subscription.id,
    asaas_payment_id: payment.id,
    asaas_invoice_url: payment.invoiceUrl,
    value: payment.value,
    status: asaasService.mapPaymentStatus(payment.status),
    payment_method: payment.billingType,
    due_date: payment.dueDate,
    description: payment.description || `Pagamento ${payment.dueDate}`
  };

  if (existingPayment) {
    await supabase
      .from('payments')
      .update(paymentData)
      .eq('id', existingPayment.id);
  } else {
    await supabase
      .from('payments')
      .insert([paymentData]);
  }

  // Atualizar webhook com relacionamentos
  await supabase
    .from('asaas_webhooks')
    .update({
      user_id: subscription.user_id,
      subscription_id: subscription.id
    })
    .eq('id', webhookId);
}

/**
 * Pagamento confirmado/recebido
 */
async function handlePaymentConfirmed(payment, webhookId) {
  console.log(`[Webhook] Pagamento confirmado: ${payment.id}`);

  // Buscar subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', payment.subscription)
    .single();

  if (!subscription) {
    console.log('[Webhook] Subscription nao encontrada');
    return;
  }

  // Atualizar payment
  await supabase
    .from('payments')
    .update({
      status: 'received',
      payment_date: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id);

  // Ativar subscription se estava pending
  if (subscription.status === 'pending' || subscription.status === 'past_due') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        started_at: subscription.started_at || new Date().toISOString(),
        last_payment_date: new Date().toISOString(),
        last_payment_status: 'received'
      })
      .eq('id', subscription.id);

    console.log(`[Webhook] Subscription ${subscription.id} ativada!`);
  } else {
    // Atualizar info de pagamento
    await supabase
      .from('subscriptions')
      .update({
        last_payment_date: new Date().toISOString(),
        last_payment_status: 'received'
      })
      .eq('id', subscription.id);
  }

  // Atualizar webhook
  await supabase
    .from('asaas_webhooks')
    .update({
      user_id: subscription.user_id,
      subscription_id: subscription.id
    })
    .eq('id', webhookId);
}

/**
 * Pagamento atrasado
 */
async function handlePaymentOverdue(payment, webhookId) {
  console.log(`[Webhook] Pagamento atrasado: ${payment.id}`);

  // Buscar subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', payment.subscription)
    .single();

  if (!subscription) return;

  // Atualizar payment
  await supabase
    .from('payments')
    .update({
      status: 'overdue'
    })
    .eq('asaas_payment_id', payment.id);

  // Marcar subscription como past_due
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      last_payment_status: 'overdue'
    })
    .eq('id', subscription.id);

  console.log(`[Webhook] Subscription ${subscription.id} marcada como past_due`);

  // Atualizar webhook
  await supabase
    .from('asaas_webhooks')
    .update({
      user_id: subscription.user_id,
      subscription_id: subscription.id
    })
    .eq('id', webhookId);
}

/**
 * Pagamento deletado/estornado
 */
async function handlePaymentDeleted(payment, webhookId) {
  console.log(`[Webhook] Pagamento deletado/estornado: ${payment.id}`);

  // Buscar subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', payment.subscription)
    .single();

  if (!subscription) return;

  // Atualizar payment
  await supabase
    .from('payments')
    .update({
      status: 'refunded'
    })
    .eq('asaas_payment_id', payment.id);

  // Se era o ultimo pagamento confirmado, desativar subscription
  if (subscription.status === 'active') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    console.log(`[Webhook] Subscription ${subscription.id} cancelada por estorno`);
  }

  // Atualizar webhook
  await supabase
    .from('asaas_webhooks')
    .update({
      user_id: subscription.user_id,
      subscription_id: subscription.id
    })
    .eq('id', webhookId);
}

module.exports = router;




