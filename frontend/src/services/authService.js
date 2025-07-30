import api from './api';

export const authService = {
  async login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  async updateProfile(userId, userData) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },
};
