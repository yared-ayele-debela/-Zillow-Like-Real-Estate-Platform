import api from './api';

const adminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  getAdvancedReport: async (params = {}) => {
    const response = await api.get('/admin/reports/advanced', { params });
    return response.data;
  },

  downloadAdvancedReport: async (params = {}, format = 'csv') => {
    const response = await api.get('/admin/reports/advanced/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Property Management
  getProperties: async (params = {}) => {
    const response = await api.get('/admin/properties', { params });
    return response.data;
  },

  approveProperty: async (id) => {
    const response = await api.post(`/admin/properties/${id}/approve`);
    return response.data;
  },

  rejectProperty: async (id, reason) => {
    const response = await api.post(`/admin/properties/${id}/reject`, { reason });
    return response.data;
  },

  featureProperty: async (id) => {
    const response = await api.post(`/admin/properties/${id}/feature`);
    return response.data;
  },

  // Review Moderation
  getPendingReviews: async (params = {}) => {
    const response = await api.get('/admin/reviews/pending', { params });
    return response.data;
  },

  approveReview: async (id) => {
    const response = await api.post(`/admin/reviews/${id}/approve`);
    return response.data;
  },

  rejectReview: async (id) => {
    const response = await api.post(`/admin/reviews/${id}/reject`);
    return response.data;
  },

  // Location Management
  getLocations: async (params = {}) => {
    const response = await api.get('/admin/locations', { params });
    return response.data;
  },

  createLocation: async (payload) => {
    const response = await api.post('/admin/locations', payload);
    return response.data;
  },

  updateLocation: async (id, payload) => {
    const response = await api.put(`/admin/locations/${id}`, payload);
    return response.data;
  },

  deleteLocation: async (id) => {
    const response = await api.delete(`/admin/locations/${id}`);
    return response.data;
  },

  syncLocations: async () => {
    const response = await api.post('/admin/locations/sync');
    return response.data;
  },

  // Site & Email Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSiteSettings: async (payload, logoFile = null, faviconFile = null) => {
    if (logoFile || faviconFile) {
      const formData = new FormData();
      formData.append('site_name', payload.site_name);
      formData.append('site_description', payload.site_description || '');
      formData.append('maintenance_mode', payload.maintenance_mode);
      formData.append('allow_registration', payload.allow_registration);
      formData.append('require_email_verification', payload.require_email_verification);
      if (logoFile) formData.append('logo', logoFile, logoFile.name);
      if (faviconFile) formData.append('favicon', faviconFile, faviconFile.name);
      const response = await api.post('/admin/settings/site', formData, {
        headers: { 'Content-Type': undefined },
      });
      return response.data;
    }
    const response = await api.put('/admin/settings/site', payload);
    return response.data;
  },

  updateEmailSettings: async (payload) => {
    const response = await api.put('/admin/settings/email', payload);
    return response.data;
  },

  // Roles & Permissions
  getRoles: async () => {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  getRole: async (id) => {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data;
  },

  createRole: async (payload) => {
    const response = await api.post('/admin/roles', payload);
    return response.data;
  },

  updateRole: async (id, payload) => {
    const response = await api.put(`/admin/roles/${id}`, payload);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await api.delete(`/admin/roles/${id}`);
    return response.data;
  },

  syncRolePermissions: async (id, permissionIds) => {
    const response = await api.put(`/admin/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  getPermission: async (id) => {
    const response = await api.get(`/admin/permissions/${id}`);
    return response.data;
  },

  createPermission: async (payload) => {
    const response = await api.post('/admin/permissions', payload);
    return response.data;
  },

  updatePermission: async (id, payload) => {
    const response = await api.put(`/admin/permissions/${id}`, payload);
    return response.data;
  },

  deletePermission: async (id) => {
    const response = await api.delete(`/admin/permissions/${id}`);
    return response.data;
  },
};

export default adminService;
