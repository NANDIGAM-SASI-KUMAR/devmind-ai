import api from './client.js';

export const securityAPI = {
  get: async () => {
    const { data } = await api.get('/auth/security');
    return data;
  }
};
