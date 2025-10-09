import api from './api';

/**
 * API de Assinaturas
 */
export const subscriptionApi = {
  /**
   * Criar nova assinatura
   * @param {Object} data - { paymentMethod: 'PIX'|'CREDIT_CARD', creditCard, creditCardHolder }
   */
  create: async (data) => {
    const response = await api.post('/subscriptions/create', data);
    return response.data;
  },

  /**
   * Consultar status da assinatura
   */
  getStatus: async () => {
    const response = await api.get('/subscriptions/status');
    return response.data;
  },

  /**
   * Verificar assinatura (para alertas)
   */
  check: async () => {
    const response = await api.get('/subscriptions/check');
    return response.data;
  },

  /**
   * Cancelar assinatura
   */
  cancel: async () => {
    const response = await api.delete('/subscriptions/cancel');
    return response.data;
  },

  /**
   * Listar histórico de pagamentos
   */
  getPayments: async () => {
    const response = await api.get('/subscriptions/payments');
    return response.data;
  }
};

/**
 * API de Autenticação
 */
export const authApi = {
  /**
   * Registro de novo usuário
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login
   */
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Heartbeat - validação periódica
   */
  heartbeat: async (deviceInfo) => {
    const response = await api.post('/auth/heartbeat', deviceInfo);
    return response.data;
  }
};
