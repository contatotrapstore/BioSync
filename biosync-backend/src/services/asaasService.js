const axios = require('axios');

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmE2Y2JlMWEwLWVjNzctNGUxMC1hODIyLWQzZTNmNWMyYzMxZTo6JGFhY2hfZjgxZWEyMTMtY2NiZC00OTU0LWJjYzEtYjE0NTMyOTBiNWM2';
const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

const asaasClient = axios.create({
  baseURL: ASAAS_BASE_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

class AsaasService {
  // Criar cliente no Asaas
  async createCustomer(userData) {
    try {
      const response = await asaasClient.post('/customers', {
        name: userData.name,
        email: userData.email,
        cpfCnpj: userData.cpf || undefined,
        mobilePhone: userData.phone || undefined
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente Asaas:', error.response?.data || error.message);
      throw new Error('Falha ao criar cliente no Asaas');
    }
  }

  // Criar cobrança (pagamento único)
  async createPayment(paymentData) {
    try {
      const response = await asaasClient.post('/payments', {
        customer: paymentData.customerId,
        billingType: paymentData.billingType || 'PIX', // PIX, CREDIT_CARD, BOLETO
        value: paymentData.amount,
        dueDate: paymentData.dueDate,
        description: paymentData.description || 'Assinatura NeuroOne',
        externalReference: paymentData.subscriptionId,
        // Para PIX
        ...(paymentData.billingType === 'PIX' && {
          pixConfig: {
            expirationSeconds: 3600 // 1 hora para pagar
          }
        })
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pagamento Asaas:', error.response?.data || error.message);
      throw new Error('Falha ao criar pagamento no Asaas');
    }
  }

  // Criar assinatura recorrente
  async createSubscription(subscriptionData) {
    try {
      const response = await asaasClient.post('/subscriptions', {
        customer: subscriptionData.customerId,
        billingType: subscriptionData.billingType || 'PIX',
        value: subscriptionData.amount,
        nextDueDate: subscriptionData.nextDueDate,
        cycle: subscriptionData.cycle || 'MONTHLY', // MONTHLY, YEARLY
        description: subscriptionData.description || 'Assinatura NeuroOne',
        externalReference: subscriptionData.userSubscriptionId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar assinatura Asaas:', error.response?.data || error.message);
      throw new Error('Falha ao criar assinatura no Asaas');
    }
  }

  // Cancelar assinatura
  async cancelSubscription(asaasSubscriptionId) {
    try {
      const response = await asaasClient.delete(`/subscriptions/${asaasSubscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar assinatura Asaas:', error.response?.data || error.message);
      throw new Error('Falha ao cancelar assinatura no Asaas');
    }
  }

  // Buscar pagamento
  async getPayment(paymentId) {
    try {
      const response = await asaasClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pagamento Asaas:', error.response?.data || error.message);
      throw new Error('Falha ao buscar pagamento no Asaas');
    }
  }

  // Buscar QR Code PIX
  async getPixQrCode(paymentId) {
    try {
      const response = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar QR Code PIX:', error.response?.data || error.message);
      throw new Error('Falha ao buscar QR Code PIX');
    }
  }

  // Validar webhook (assinatura do Asaas)
  validateWebhook(payload, signature) {
    // Asaas não envia assinatura por padrão, mas você pode validar por IP
    // IPs do Asaas: 191.235.84.0/22, 191.235.88.0/21
    return true; // Por enquanto aceita todos
  }
}

module.exports = new AsaasService();

