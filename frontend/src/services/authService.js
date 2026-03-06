import api from './api';

export const authService = {
  // Register
  register: async (data) => {
    const response = await api.post('/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Login
  login: async (data) => {
    const response = await api.post('/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    await api.post('/logout');
    localStorage.removeItem('token');
  },

  // Get current user
  getUser: async () => {
    const response = await api.get('/user');
    return response.data.user;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (data) => {
    const response = await api.post('/reset-password', data);
    return response.data;
  },

  // Send email verification
  sendVerificationEmail: async () => {
    const response = await api.post('/email/verification-notification');
    return response.data;
  },

  // Update profile. Uses POST so PHP parses multipart/form-data (PHP only parses it for POST, not PUT).
  updateProfile: async (data) => {
    let formData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      const fields = ['name', 'email', 'phone', 'bio', 'company_name', 'license_number'];
      fields.forEach((key) => {
        if (data[key] !== undefined) {
          formData.append(key, data[key] ?? '');
        }
      });
      if (data.avatar && data.avatar instanceof File) {
        formData.append('avatar', data.avatar);
      }
    }

    const response = await api.post('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  },
};
