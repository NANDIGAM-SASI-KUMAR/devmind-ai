import api from './client.js';

export const authAPI = {
  signup: async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    return data;
  },
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  }
};
