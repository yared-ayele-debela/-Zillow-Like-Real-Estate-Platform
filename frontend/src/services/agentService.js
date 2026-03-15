import api from './api';

export const agentService = {
  getAgents: async (params = {}) => {
    const response = await api.get('/agents', { params });
    return response.data;
  },

  getAgentDetail: async (id, params = {}) => {
    const response = await api.get(`/agents/${id}`, { params });
    return response.data;
  },
};

