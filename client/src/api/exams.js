import api from './client.js';

export const examsAPI = {
  // Global (cross study-plan)
  listAll: async () => {
    const { data } = await api.get('/exams');
    return data;
  },
  listAllHistory: async () => {
    const { data } = await api.get('/exams/history');
    return data;
  },
  listAllRecommendations: async () => {
    const { data } = await api.get('/exams/recommendations');
    return data;
  },

  // Scoped to a study plan
  listForPlan: async (planId) => {
    const { data } = await api.get(`/study-plans/${planId}/exams`);
    return data;
  },
  create: async (planId, config) => {
    const { data } = await api.post(`/study-plans/${planId}/exams`, config);
    return data;
  },
  historyForPlan: async (planId) => {
    const { data } = await api.get(`/study-plans/${planId}/exam-history`);
    return data;
  },
  mastery: async (planId) => {
    const { data } = await api.get(`/study-plans/${planId}/mastery`);
    return data;
  },
  recommendationsForPlan: async (planId) => {
    const { data } = await api.get(`/study-plans/${planId}/recommendations`);
    return data;
  },

  // A single exam
  get: async (examId) => {
    const { data } = await api.get(`/exams/${examId}`);
    return data;
  },
  startAttempt: async (examId) => {
    const { data } = await api.post(`/exams/${examId}/attempts`);
    return data;
  },

  // A single attempt
  getAttempt: async (attemptId) => {
    const { data } = await api.get(`/exams/attempts/${attemptId}`);
    return data;
  },
  saveAnswer: async (attemptId, questionIndex, answer, flagged) => {
    const { data } = await api.patch(`/exams/attempts/${attemptId}/answer`, { questionIndex, answer, flagged });
    return data;
  },
  submit: async (attemptId) => {
    const { data } = await api.post(`/exams/attempts/${attemptId}/submit`);
    return data;
  },
  getResult: async (attemptId) => {
    const { data } = await api.get(`/exams/attempts/${attemptId}/result`);
    return data;
  },

  // Recommendations
  startFollowUp: async (recommendationId) => {
    const { data } = await api.post(`/recommendations/${recommendationId}/start-followup`);
    return data;
  },
  dismissRecommendation: async (recommendationId) => {
    const { data } = await api.post(`/recommendations/${recommendationId}/dismiss`);
    return data;
  }
};
