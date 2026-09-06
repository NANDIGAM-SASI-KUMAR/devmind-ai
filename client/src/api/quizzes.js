import api from './client.js';

export const quizzesAPI = {
  get: async (id) => {
    const { data } = await api.get(`/quizzes/${id}`);
    return data;
  },
  submit: async (id, answers) => {
    const { data } = await api.post(`/quizzes/${id}/submit`, { answers });
    return data;
  }
};
