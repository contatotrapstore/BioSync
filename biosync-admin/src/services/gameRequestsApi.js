import api from './api';

export const gameRequestsAPI = {
  // Listar todas as requisições
  getAll: async (params = {}) => {
    const response = await api.get('/game-requests', { params });
    return response.data;
  },

  // Contar requisições pendentes
  getPendingCount: async () => {
    const response = await api.get('/game-requests/pending/count');
    return response.data;
  },

  // Aprovar requisição
  approve: async (id, adminResponse = '') => {
    const response = await api.patch(`/game-requests/${id}`, {
      status: 'approved',
      admin_response: adminResponse
    });
    return response.data;
  },

  // Rejeitar requisição
  reject: async (id, adminResponse = '') => {
    const response = await api.patch(`/game-requests/${id}`, {
      status: 'rejected',
      admin_response: adminResponse
    });
    return response.data;
  }
};
