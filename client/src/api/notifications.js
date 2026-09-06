import api from './client.js';

export const notificationsAPI = {
  list: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },
  markRead: async (id) => {
    const { data } = await api.post(`/notifications/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await api.post('/notifications/read-all');
    return data;
  }
};
