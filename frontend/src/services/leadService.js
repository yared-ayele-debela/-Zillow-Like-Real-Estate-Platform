import api from './api';

const leadService = {
  getLeads: async (params = {}) => {
    const response = await api.get('/agent/leads', { params });
    return response.data;
  },

  getLead: async (id) => {
    const response = await api.get(`/agent/leads/${id}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.post(`/agent/leads/${id}/read`);
    return response.data;
  },

  markMultipleAsRead: async (messageIds) => {
    const response = await api.post('/agent/leads/mark-read', {
      message_ids: messageIds,
    });
    return response.data;
  },

  updateLead: async (id, data) => {
    const response = await api.patch(`/agent/leads/${id}`, data);
    return response.data;
  },

  reply: async (id, data) => {
    const response = await api.post(`/agent/leads/${id}/reply`, data);
    return response.data;
  },

  exportLeads: async () => {
    const response = await api.get('/agent/leads/export', {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },
};

export default leadService;
