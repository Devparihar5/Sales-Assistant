import api from './api';

export const clientService = {
  async getClients(params = {}) {
    const response = await api.get('/clients', { params });
    return response.data;
  },
  
  async getClient(id) {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client with ID ${id}:`, error);
      throw error;
    }
  },
  
  async createClient(clientData) {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  
  async updateClient(id, clientData) {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },
  
  async deleteClient(id) {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};
