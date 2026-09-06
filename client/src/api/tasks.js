import api from './client.js';

export const tasksAPI = {
  list: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/tasks`);
    return data;
  },
  create: async (projectId, task) => {
    const { data } = await api.post(`/projects/${projectId}/tasks`, task);
    return data;
  },
  createBulk: async (projectId, items) => {
    const { data } = await api.post(`/projects/${projectId}/tasks/bulk`, { items });
    return data;
  },
  update: async (id, updates) => {
    const { data } = await api.put(`/tasks/${id}`, updates);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },
  generatePlan: async (projectId, goal) => {
    const { data } = await api.post(`/projects/${projectId}/plan`, { goal });
    return data;
  }
};
