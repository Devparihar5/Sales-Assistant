import api from './api';

export const productService = {
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      console.log('Products API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  async getProduct(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  },
  
  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  async updateProduct(id, productData) {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  async uploadDocument(productId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/products/${productId}/upload-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
