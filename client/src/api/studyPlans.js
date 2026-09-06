import api from './client.js';

export const studyPlansAPI = {
  list: async () => {
    const { data } = await api.get('/study-plans');
    return data;
  },
  create: async (name, understandingLevel) => {
    const { data } = await api.post('/study-plans', { name, understandingLevel });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/study-plans/${id}`);
    return data;
  },
  update: async (id, updates) => {
    const { data } = await api.put(`/study-plans/${id}`, updates);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/study-plans/${id}`);
    return data;
  },
  listMaterials: async (id) => {
    const { data } = await api.get(`/study-plans/${id}/materials`);
    return data;
  },
  uploadMaterial: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/study-plans/${id}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  deleteMaterial: async (id, materialId) => {
    const { data } = await api.delete(`/study-plans/${id}/materials/${materialId}`);
    return data;
  },
  search: async (id, q) => {
    const { data } = await api.get(`/study-plans/${id}/search?q=${encodeURIComponent(q)}`);
    return data;
  },
  ask: async (id, question) => {
    const { data } = await api.post(`/study-plans/${id}/ask`, { question });
    return data;
  },
  generatePlan: async (id) => {
    const { data } = await api.post(`/study-plans/${id}/generate-plan`);
    return data;
  },
  listQuizzes: async (id) => {
    const { data } = await api.get(`/study-plans/${id}/quizzes`);
    return data;
  },
  generateQuiz: async (id) => {
    const { data } = await api.post(`/study-plans/${id}/quizzes`);
    return data;
  },
  getProgress: async (id) => {
    const { data } = await api.get(`/study-plans/${id}/progress`);
    return data;
  }
};
