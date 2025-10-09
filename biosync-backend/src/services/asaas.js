const crypto = require('crypto');
const axios = require('axios');

/**
 * Servico de Integracao com Asaas
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
};

const validateWebhook = (payload, signature) => {
  const secret = process.env.ASAAS_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[Asaas] ASAAS_WEBHOOK_SECRET not configured. Skipping webhook signature validation.');
    return true;
  }

  if (!signature) {
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
      name: userData.full_name,
      email: userData.email,
      cpfCnpj: userData.cpf || undefined,
      phone: userData.phone || undefined,
      externalReference: userData.id
    });

    return response.data;
  } catch (error) {
    logAsaasError('createCustomer', error);
    throw new Error(error.response?.data?.errors?.[0]?.description || 'Falha ao criar cliente no Asaas');
  }
};

/**
 * Criar cobranca unica (pagamento mensal nao recorrente)
 */
const createPayment = async (customerId, paymentData) => {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const response = await asaasClient.post('/payments', {
      customer: customerId,
      billingType: paymentData.paymentMethod || 'PIX',
      value: parseFloat(paymentData.value || process.env.SUBSCRIPTION_VALUE || 149.90),
      dueDate: dueDate.toISOString().split('T')[0],
      description: paymentData.description || 'BioSync - Mensalidade',
      creditCard: paymentData.creditCard || undefined,
      creditCardHolderInfo: paymentData.creditCardHolder || undefined,
      externalReference: paymentData.userId,
      postalService: false
    });

    return response.data;
  } catch (error) {
    logAsaasError('createPayment', error);
    throw new Error(error.response?.data?.errors?.[0]?.description || 'Falha ao criar cobranca');
  }
};

/**
 * Criar assinatura mensal (deprecated - usar createPayment)
 */
const createSubscription = async (customerId, subscriptionData) => {
  try {
    const response = await asaasClient.post('/subscriptions', {
      customer: customerId,
      billingType: subscriptionData.paymentMethod || 'CREDIT_CARD',
      value: parseFloat(subscriptionData.value || process.env.SUBSCRIPTION_VALUE || 149.90),
      nextDueDate: subscriptionData.nextDueDate || getNextDueDate(),
      cycle: 'MONTHLY',
      description: subscriptionData.description || 'BioSync - Assinatura Mensal',
      creditCard: subscriptionData.creditCard || undefined,
      creditCardHolderInfo: subscriptionData.creditCardHolder || undefined,
      updatePaymentValue: false,
      externalReference: subscriptionData.userId
    });

    return response.data;
  } catch (error) {
    logAsaasError('createSubscription', error);
    throw new Error(error.response?.data?.errors?.[0]?.description || 'Falha ao criar assinatura');
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

