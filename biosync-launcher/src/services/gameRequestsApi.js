import api from './api';

export const gameRequestsApi = {
  // Criar nova requisição
  create: async (gameId, message = '') => {
    const response = await api.post('/game-requests', {
      game_id: gameId,
      request_message: message
    });
    return response.data;
  },

  // Listar minhas requisições
  getMyRequests: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/game-requests', { params });
    return response.data;
  },

  // Cancelar requisição
  cancel: async (requestId) => {
    const response = await api.delete(`/game-requests/${requestId}`);
    return response.data;
  }
};
