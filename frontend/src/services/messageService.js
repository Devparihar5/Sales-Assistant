import api from './api';

export const messageService = {
  async getMessages(params = {}) {
    try {
      console.log('Fetching messages with params:', params);
      const response = await api.get('/messages', { params });
      console.log('Messages response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error.response?.data || error.message);
      throw error;
    }
  },
  
  async getMessage(id) {
    try {
      console.log(`Fetching message with ID: ${id}`);
      const response = await api.get(`/messages/${id}`);
      console.log('Message response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching message with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  async generateMessage(messageData) {
    console.log('Generating message with data:', JSON.stringify(messageData, null, 2));
    try {
      const response = await api.post('/messages/generate', messageData);
      return response.data;
    } catch (error) {
      console.error('Error generating message:', error.response?.data || error.message);
      throw error;
    }
  },
  
  async updateMessage(id, messageData) {
    const response = await api.put(`/messages/${id}`, messageData);
    return response.data;
  },
  
  async recordClientResponse(id, responseContent) {
    const response = await api.post(`/messages/${id}/record-response`, { response_content: responseContent });
    return response.data;
  },
};
