import api from './api';

const settingsService = {
  /**
   * Get public web settings (site name, logo, favicon) - no auth required.
   */
  getPublicWebSettings: async () => {
    const response = await api.get('/web-settings');
    return response.data;
  },
};

export default settingsService;
