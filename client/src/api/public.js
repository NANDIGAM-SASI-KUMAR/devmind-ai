import api from './client.js';

export const publicAPI = {
  submitContact: async ({ name, email, message }) => {
    const { data } = await api.post('/public/contact', { name, email, message });
    return data;
  },
  freeAudit: async ({ code, language }) => {
    const { data } = await api.post('/public/audit', { code, language });
    return data;
  }
};
