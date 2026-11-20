import api from './api';

export default {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    // Le JWT est conservé uniquement dans un cookie HttpOnly géré par l'API.
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/user/profile');
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  async logout() {
    try { await api.post('/auth/logout'); } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'Admin');
  }
};
