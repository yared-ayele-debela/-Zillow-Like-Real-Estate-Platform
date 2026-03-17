import api from './api';

const paymentService = {
  // Create payment
  createPayment: async (data) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (id) => {
    const response = await api.post(`/payments/${id}/confirm`);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    const response = await api.get('/payments/history', { params });
    return response.data;
  },

  // Request refund
  requestRefund: async (id) => {
    const response = await api.post(`/payments/${id}/refund`);
    return response.data;
  },

  // Feature property
  featureProperty: async (propertyId, packageId) => {
    const response = await api.post(`/properties/${propertyId}/feature`, {
      package_id: packageId,
    });
    return response.data;
  },

  // Subscription methods
  createSubscription: async (plan) => {
    const response = await api.post('/subscriptions', { plan });
    return response.data;
  },

  confirmCheckout: async (sessionId) => {
    const response = await api.post('/subscriptions/confirm-checkout', { session_id: sessionId });
    return response.data;
  },

  cancelSubscription: async (id) => {
    const response = await api.post(`/subscriptions/${id}/cancel`);
    return response.data;
  },

  getCurrentSubscription: async () => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  checkSubscription: async () => {
    const response = await api.get('/subscriptions/check');
    return response.data;
  },

  // Public configs
  getSubscriptionPlans: async () => {
    const response = await api.get('/subscription-plans');
    return response.data;
  },

  getFeaturedPackages: async () => {
    const response = await api.get('/featured-packages');
    return response.data;
  },

  // Admin configs
  getAdminPlans: async () => {
    const response = await api.get('/admin/payment-config/plans');
    return response.data;
  },
  createAdminPlan: async (payload) => {
    const response = await api.post('/admin/payment-config/plans', payload);
    return response.data;
  },
  updateAdminPlan: async (id, payload) => {
    const response = await api.put(`/admin/payment-config/plans/${id}`, payload);
    return response.data;
  },
  deleteAdminPlan: async (id) => {
    const response = await api.delete(`/admin/payment-config/plans/${id}`);
    return response.data;
  },
  getAdminFeaturedPackages: async () => {
    const response = await api.get('/admin/payment-config/featured-packages');
    return response.data;
  },
  createAdminFeaturedPackage: async (payload) => {
    const response = await api.post('/admin/payment-config/featured-packages', payload);
    return response.data;
  },
  updateAdminFeaturedPackage: async (id, payload) => {
    const response = await api.put(`/admin/payment-config/featured-packages/${id}`, payload);
    return response.data;
  },
  deleteAdminFeaturedPackage: async (id) => {
    const response = await api.delete(`/admin/payment-config/featured-packages/${id}`);
    return response.data;
  },
};

export default paymentService;
