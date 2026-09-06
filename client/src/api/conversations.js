import api from './client.js';

export const conversationsAPI = {
  list: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/conversations`);
    return data;
  },
  listArchived: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/conversations/archived`);
    return data;
  },
  create: async (projectId, title) => {
    const { data } = await api.post(`/projects/${projectId}/conversations`, { title });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
  },
  update: async (id, updates) => {
    const { data } = await api.put(`/conversations/${id}`, updates);
    return data;
  },
  trash: async (id) => {
    const { data } = await api.delete(`/conversations/${id}`);
    return data;
  },
  restore: async (id) => {
    const { data } = await api.post(`/conversations/${id}/restore`);
    return data;
  },
  permanentlyDelete: async (id) => {
    const { data } = await api.delete(`/conversations/${id}/permanent`);
    return data;
  },
  listTrash: async () => {
    const { data } = await api.get('/conversations/trash');
    return data;
  },
  emptyTrash: async () => {
    const { data } = await api.delete('/conversations/trash');
    return data;
  },
  listPinned: async () => {
    const { data } = await api.get('/conversations/pinned');
    return data;
  },
  messages: async (id) => {
    const { data } = await api.get(`/conversations/${id}/messages`);
    return data;
  },
  search: async (q) => {
    const { data } = await api.get(`/conversations/search?q=${encodeURIComponent(q)}`);
    return data;
  }
};
