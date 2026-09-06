import api from './client.js';

export const authAPI = {
  signup: async (name, email, phone, password) => {
    const { data } = await api.post('/auth/signup', { name, email, phone, password });
    return data;
  },
  verifySignupOtp: async (email, code) => {
    const { data } = await api.post('/auth/verify-signup-otp', { email, code });
    return data;
  },
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  verifyLoginOtp: async (email, code) => {
    const { data } = await api.post('/auth/verify-login-otp', { email, code });
    return data;
  },
  resendOtp: async (email, purpose) => {
    const { data } = await api.post('/auth/resend-otp', { email, purpose });
    return data;
  },
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  verifyResetOtp: async (email, code) => {
    const { data } = await api.post('/auth/verify-reset-otp', { email, code });
    return data;
  },
  resetPassword: async (resetToken, password) => {
    const { data } = await api.post('/auth/reset-password', { resetToken, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  updateMe: async (updates) => {
    const { data } = await api.put('/auth/me', updates);
    return data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
  deleteAccount: async (password) => {
    const { data } = await api.delete('/auth/me', { data: { password } });
    return data;
  }
};
