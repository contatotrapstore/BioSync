const { supabase } = require('../config/supabase');
const asaasService = require('../services/asaasService');

class WebhookController {
  // Webhook do Asaas para notificações de pagamento
  async asaasWebhook(req, res) {
    try {
      const event = req.body;

      console.log('📬 Webhook Asaas recebido:', event.event, event.payment?.id);

      // Validar webhook (opcional - por IP)
      // const isValid = asaasService.validateWebhook(req.body, req.headers['asaas-signature']);
      // if (!isValid) {
      //   return res.status(401).json({ error: 'Invalid signature' });
      // }

      // Processar diferentes tipos de eventos
      switch (event.event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          await this.handlePaymentConfirmed(event.payment);
          break;

        case 'PAYMENT_OVERDUE':
          await this.handlePaymentOverdue(event.payment);
          break;

        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          await this.handlePaymentCancelled(event.payment);
          break;

        default:
          console.log(`Evento não processado: ${event.event}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  // Pagamento confirmado/recebido
  async handlePaymentConfirmed(payment) {
    try {
      console.log('✅ Pagamento confirmado:', payment.id);

      // Atualizar pagamento no banco
      const { data: dbPayment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          payment_date: new Date().toISOString()
        })
        .eq('asaas_payment_id', payment.id)
        .select()
        .single();

      if (paymentError) {
        console.error('Erro ao atualizar pagamento:', paymentError);
        return;
      }

      if (!dbPayment) {
        console.log('Pagamento não encontrado no banco:', payment.id);
        return;
      }

      // Buscar assinatura
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', dbPayment.subscription_id)
        .single();

      if (subError || !subscription) {
        console.error('Assinatura não encontrada:', dbPayment.subscription_id);
        return;
      }

      // Ativar assinatura e definir data de expiração
      const expiresAt = new Date();
      if (subscription.plan_type === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
        .eq('id', subscription.id);

      console.log(`✅ Assinatura ativada até ${expiresAt.toISOString()}`);
    } catch (error) {
      console.error('Erro em handlePaymentConfirmed:', error);
    }
  }

  // Pagamento atrasado
  async handlePaymentOverdue(payment) {
    try {
      console.log('⚠️ Pagamento atrasado:', payment.id);

      // Atualizar status do pagamento
      await supabase
        .from('payments')
        .update({ status: 'overdue' })
        .eq('asaas_payment_id', payment.id);

      // Buscar assinatura relacionada
      const { data: dbPayment } = await supabase
        .from('payments')
        .select('subscription_id')
        .eq('asaas_payment_id', payment.id)
        .single();

      if (dbPayment) {
        // Pode desativar a assinatura ou apenas marcar como pendente
        await supabase
          .from('subscriptions')
          .update({ status: 'overdue' })
          .eq('id', dbPayment.subscription_id);

        console.log('⚠️ Assinatura marcada como atrasada');
      }
    } catch (error) {
      console.error('Erro em handlePaymentOverdue:', error);
    }
  }

  // Pagamento cancelado/reembolsado
  async handlePaymentCancelled(payment) {
    try {
      console.log('❌ Pagamento cancelado/reembolsado:', payment.id);

      // Atualizar pagamento
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('asaas_payment_id', payment.id);

      // Buscar e cancelar assinatura
      const { data: dbPayment } = await supabase
        .from('payments')
        .select('subscription_id')
        .eq('asaas_payment_id', payment.id)
        .single();

      if (dbPayment) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', dbPayment.subscription_id);

        console.log('❌ Assinatura cancelada');
      }
    } catch (error) {
      console.error('Erro em handlePaymentCancelled:', error);
    }
  }
}

module.exports = new WebhookController();
