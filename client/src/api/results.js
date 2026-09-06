import api from './client.js';

export const resultsAPI = {
  overview: async () => (await api.get('/results/overview')).data,
  trend: async (range = 'all', type = 'all') => (await api.get(`/results/trend?range=${range}&type=${type}`)).data,
  topics: async () => (await api.get('/results/topics')).data,
  topicDetail: async (topic) => (await api.get(`/results/topics/${encodeURIComponent(topic)}`)).data,
  quizAnalytics: async () => (await api.get('/results/quiz-analytics')).data,
  examAnalytics: async () => (await api.get('/results/exam-analytics')).data,
  studyPlans: async () => (await api.get('/results/study-plans')).data,
  activity: async () => (await api.get('/results/activity')).data,
  insights: async () => (await api.get('/results/insights')).data
};
