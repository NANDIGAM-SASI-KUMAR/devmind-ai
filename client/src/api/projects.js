import api from './client.js';

export const projectsAPI = {
  list: async () => {
    const { data } = await api.get('/projects');
    return data;
  },
  create: async (project) => {
    const { data } = await api.post('/projects', project);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },
  update: async (id, updates) => {
    const { data } = await api.put(`/projects/${id}`, updates);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },
  messages: async (id) => {
    const { data } = await api.get(`/projects/${id}/messages`);
    return data;
  }
};
