import api from './client.js';

export const projectBrainAPI = {
  list: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/brain`);
    return data;
  },
  add: async (projectId, category, content) => {
    const { data } = await api.post(`/projects/${projectId}/brain`, { category, content });
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/brain/${id}`);
    return data;
  }
};
