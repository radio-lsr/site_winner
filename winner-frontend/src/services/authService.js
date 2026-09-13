import api from './api';

export default {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // L'inscription publique est désactivée : les comptes sont créés
  // uniquement par un administrateur depuis le panneau d'administration.

  async getProfile() {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Demande de réinitialisation du mot de passe
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Réinitialisation effective via le token reçu
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Utilisateur actuellement stocké (objet ou null)
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'Admin');
  }
};
