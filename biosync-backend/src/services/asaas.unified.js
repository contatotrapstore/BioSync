const crypto = require('crypto');
const axios = require('axios');

/**
 * Servico Unificado de Integracao com Asaas
 * Documentacao: https://docs.asaas.com
 */
const ASAAS_API_URL = process.env.ASAAS_ENVIRONMENT === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

const logAsaasError = (context, error) => {
  const description = error.response?.data?.errors?.[0]?.description || error.message;
  const status = error.response?.status;
  const formatted = status ? `${description} (status ${status})` : description;
  console.error(`[Asaas] ${context}: ${formatted}`);

  // Log completo do erro para debug
  if (error.response?.data?.errors) {
    console.error('[Asaas] Erros detalhados:', JSON.stringify(error.response.data.errors, null, 2));
  }
};

/**
 * Validar webhook com HMAC SHA256
 */
const validateWebhook = (payload, signature) => {
  const secret = process.env.ASAAS_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[Asaas] ASAAS_WEBHOOK_SECRET not configured. Skipping webhook signature validation.');
    return true;
  }

  if (!signature) {
    console.warn('[Asaas] No signature provided in webhook');
    return false;
  }

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const digest = crypto.createHmac('sha256', secret).update(payloadString).digest();
  const normalizedSignature = signature.trim();

  const possibilities = [];
  possibilities.push(Buffer.from(normalizedSignature));

  if (normalizedSignature.length === digest.length * 2) {
    possibilities.push(Buffer.from(normalizedSignature, 'hex'));
  }

  try {
    possibilities.push(Buffer.from(normalizedSignature, 'base64'));
  } catch (error) {
    // ignorar tentativa invalida de base64
  }

  return possibilities.some((candidate) => candidate.length === digest.length && crypto.timingSafeEqual(candidate, digest));
};

/**
 * Criar cliente no Asaas
 */
const createCustomer = async (userData) => {
  try {
    const response = await asaasClient.post('/customers', {
      name: userData.full_name || userData.name,
      email: userData.email,
      cpfCnpj: userData.cpf || undefined,
      phone: userData.phone || undefined,
      mobilePhone: userData.phone || undefined,
      externalReference: userData.id
    });

    console.log(`[Asaas] Cliente criado: ${response.data.id}`);
    return response.data;
  } catch (error) {
    logAsaasError('createCustomer', error);
    throw new Error(error.response?.data?.errors?.[0]?.description || 'Falha ao criar cliente no Asaas');
  }
};

/**
 * Criar cobranca unica (recomendado para PIX)
 * Para pagamento mensal recorrente, criar novo payment a cada mes
 */
const createPayment = async (customerId, paymentData) => {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const payload = {
      customer: customerId,
      billingType: paymentData.paymentMethod || 'PIX',
      value: parseFloat(paymentData.value || process.env.SUBSCRIPTION_VALUE || 149.90),
      dueDate: dueDate.toISOString().split('T')[0],
      description: paymentData.description || 'BioSync - Mensalidade',
      externalReference: paymentData.userId,
      postalService: false
    };

    // Adicionar dados de cartao se fornecido
    if (paymentData.paymentMethod === 'CREDIT_CARD' && paymentData.creditCard) {
      payload.creditCard = {
        holderName: paymentData.creditCard.holderName,
        number: paymentData.creditCard.number,
        expiryMonth: paymentData.creditCard.expiryMonth,
        expiryYear: paymentData.creditCard.expiryYear,
        ccv: paymentData.creditCard.ccv
      };

      if (paymentData.creditCardHolder) {
        payload.creditCardHolderInfo = {
          name: paymentData.creditCardHolder.name,
          email: paymentData.creditCardHolder.email,
          cpfCnpj: paymentData.creditCardHolder.cpfCnpj,
          postalCode: paymentData.creditCardHolder.postalCode,
          addressNumber: paymentData.creditCardHolder.addressNumber,
          phone: paymentData.creditCardHolder.phone,
          mobilePhone: paymentData.creditCardHolder.mobilePhone || paymentData.creditCardHolder.phone
        };
      }
    }

    console.log(`[Asaas] Criando pagamento: ${payload.billingType} - R$ ${payload.value}`);
    const response = await asaasClient.post('/payments', payload);

    console.log(`[Asaas] Pagamento criado: ${response.data.id} - Status: ${response.data.status}`);
    return response.data;
  } catch (error) {
    logAsaasError('createPayment', error);

    // Extrair mensagem de erro especifica
    const errorMsg = error.response?.data?.errors?.[0]?.description || 'Falha ao criar cobranca';
    throw new Error(errorMsg);
  }
};

/**
 * Criar assinatura recorrente (use apenas para CREDIT_CARD)
 * Para PIX, use createPayment e crie novo payment todo mes
 */
const createSubscription = async (customerId, subscriptionData) => {
  try {
    const payload = {
      customer: customerId,
      billingType: subscriptionData.paymentMethod || 'CREDIT_CARD',
      value: parseFloat(subscriptionData.value || process.env.SUBSCRIPTION_VALUE || 149.90),
      nextDueDate: subscriptionData.nextDueDate || getNextDueDate(),
      cycle: 'MONTHLY',
      description: subscriptionData.description || 'BioSync - Assinatura Mensal',
      updatePaymentValue: false,
      externalReference: subscriptionData.userId
    };

    // Adicionar dados de cartao
    if (subscriptionData.creditCard) {
      payload.creditCard = {
        holderName: subscriptionData.creditCard.holderName,
        number: subscriptionData.creditCard.number,
        expiryMonth: subscriptionData.creditCard.expiryMonth,
        expiryYear: subscriptionData.creditCard.expiryYear,
        ccv: subscriptionData.creditCard.ccv
      };
    }

    if (subscriptionData.creditCardHolder) {
      payload.creditCardHolderInfo = {
        name: subscriptionData.creditCardHolder.name,
        email: subscriptionData.creditCardHolder.email,
        cpfCnpj: subscriptionData.creditCardHolder.cpfCnpj,
        postalCode: subscriptionData.creditCardHolder.postalCode,
        addressNumber: subscriptionData.creditCardHolder.addressNumber,
        phone: subscriptionData.creditCardHolder.phone,
        mobilePhone: subscriptionData.creditCardHolder.mobilePhone || subscriptionData.creditCardHolder.phone
      };
    }

    console.log(`[Asaas] Criando assinatura recorrente para cliente: ${customerId}`);
    const response = await asaasClient.post('/subscriptions', payload);

    console.log(`[Asaas] Assinatura criada: ${response.data.id}`);
    return response.data;
  } catch (error) {
    logAsaasError('createSubscription', error);
    const errorMsg = error.response?.data?.errors?.[0]?.description || 'Falha ao criar assinatura';
    throw new Error(errorMsg);
  }
};

const getSubscription = async (subscriptionId) => {
  try {
    const response = await asaasClient.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    logAsaasError('getSubscription', error);
    throw new Error('Falha ao consultar assinatura');
  }
};

const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await asaasClient.delete(`/subscriptions/${subscriptionId}`);
    console.log(`[Asaas] Assinatura cancelada: ${subscriptionId}`);
    return response.data;
  } catch (error) {
    logAsaasError('cancelSubscription', error);
    throw new Error('Falha ao cancelar assinatura');
  }
};

const listPayments = async (subscriptionId, options = {}) => {
  try {
    const response = await asaasClient.get('/payments', {
      params: {
        subscription: subscriptionId,
        ...options
      }
    });

    return response.data;
  } catch (error) {
    logAsaasError('listPayments', error);
    throw new Error('Falha ao listar pagamentos');
  }
};

const getPayment = async (paymentId) => {
  try {
    const response = await asaasClient.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    logAsaasError('getPayment', error);
    throw new Error('Falha ao consultar pagamento');
  }
};

const getPaymentLink = async (paymentId) => {
  try {
    const response = await asaasClient.get(`/payments/${paymentId}/identificationField`);
    return response.data;
  } catch (error) {
    logAsaasError('getPaymentLink', error);
    throw new Error('Falha ao gerar link de pagamento');
  }
};

const getPixQrCode = async (paymentId) => {
  try {
    const response = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
    console.log(`[Asaas] QR Code PIX obtido para pagamento: ${paymentId}`);
    return response.data;
  } catch (error) {
    logAsaasError('getPixQrCode', error);
    throw new Error('Falha ao obter QR Code PIX');
  }
};

const processWebhookEvent = async (event) => {
  const eventType = event.event;
  const payment = event.payment;

  console.log(`[Asaas Webhook] Processando evento: ${eventType}`);

  switch (eventType) {
    case 'PAYMENT_CREATED':
      console.log(`Pagamento criado: ${payment.id}`);
      break;
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      console.log(`Pagamento confirmado: ${payment.id}`);
      break;
    case 'PAYMENT_OVERDUE':
      console.log(`Pagamento atrasado: ${payment.id}`);
      break;
    case 'PAYMENT_DELETED':
      console.log(`Pagamento deletado: ${payment.id}`);
      break;
    default:
      console.log(`Evento nao tratado: ${eventType}`);
  }

  return { processed: true, eventType };
};

const getNextDueDate = () => {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return nextMonth.toISOString().split('T')[0];
};

const mapSubscriptionStatus = (asaasStatus) => {
  const statusMap = {
    ACTIVE: 'active',
    INACTIVE: 'cancelled',
    EXPIRED: 'cancelled',
    OVERDUE: 'past_due'
  };

  return statusMap[asaasStatus] || 'pending';
};

const mapPaymentStatus = (asaasStatus) => {
  const statusMap = {
    PENDING: 'pending',
    RECEIVED: 'received',
    CONFIRMED: 'confirmed',
    OVERDUE: 'overdue',
    REFUNDED: 'refunded',
    RECEIVED_IN_CASH: 'received',
    REFUND_REQUESTED: 'refund_requested',
    CHARGEBACK_REQUESTED: 'chargeback_requested',
    CHARGEBACK_DISPUTE: 'chargeback_dispute',
    AWAITING_CHARGEBACK_REVERSAL: 'awaiting_reversal',
    DUNNING_REQUESTED: 'dunning_requested',
    DUNNING_RECEIVED: 'dunning_received',
    AWAITING_RISK_ANALYSIS: 'awaiting_analysis'
  };

  return statusMap[asaasStatus] || 'pending';
};

module.exports = {
  createCustomer,
  createPayment,
  createSubscription,
  getSubscription,
  cancelSubscription,
  listPayments,
  getPayment,
  getPaymentLink,
  getPixQrCode,
  validateWebhook,
  processWebhookEvent,
  getNextDueDate,
  mapSubscriptionStatus,
  mapPaymentStatus
};
