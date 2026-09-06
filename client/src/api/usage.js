import api from './client.js';

export const usageAPI = {
  get: async () => {
    const { data } = await api.get('/usage');
    return data;
  },
  getStorage: async () => {
    const { data } = await api.get('/usage/storage');
    return data;
  },
  exportData: async () => {
    const { data } = await api.get('/usage/export');
    return data;
  }
};
