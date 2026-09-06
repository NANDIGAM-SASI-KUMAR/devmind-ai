import api from './client.js';

export const filesAPI = {
  list: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/files`);
    return data;
  },
  upload: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  remove: async (fileId) => {
    const { data } = await api.delete(`/files/${fileId}`);
    return data;
  },
  searchCode: async (projectId, q) => {
    const { data } = await api.get(`/projects/${projectId}/search-code?q=${encodeURIComponent(q)}`);
    return data;
  },
  proposeEdit: async (fileId, instruction) => {
    const { data } = await api.post(`/files/${fileId}/propose`, { instruction });
    return data;
  },
  applyEdit: async (fileId, newContent) => {
    const { data } = await api.post(`/files/${fileId}/apply`, { newContent });
    return data;
  },
  listCheckpoints: async (fileId) => {
    const { data } = await api.get(`/files/${fileId}/checkpoints`);
    return data;
  },
  restoreCheckpoint: async (fileId, checkpointId) => {
    const { data } = await api.post(`/files/${fileId}/checkpoints/${checkpointId}/restore`);
    return data;
  }
};
