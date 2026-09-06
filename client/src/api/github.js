import api from './client.js';

export const githubAPI = {
  getConnection: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/github`);
    return data;
  }
};
