import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/auth.js';

const AuthContext = createContext(null);

const setSession = (setUser, data) => {
  localStorage.setItem('token', data.token);
  setUser({ _id: data._id, name: data.name, email: data.email, phone: data.phone, avatar: data.avatar });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI
      .me()
      .then((data) => setUser(data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // ---------- Signup (email OTP verification) ----------
  // If the server has OTP verification bypassed, signup/login return a token directly
  // instead of { pending: true } — in that case log the user in immediately.
  const requestSignup = async (name, email, phone, password) => {
    const data = await authAPI.signup(name, email, phone, password);
    if (data.token) setSession(setUser, data);
    return data;
  };
  const verifySignupOtp = async (email, code) => {
    const data = await authAPI.verifySignupOtp(email, code);
    setSession(setUser, data);
    return data;
  };

  // ---------- Login (password + OTP 2FA) ----------
  const requestLogin = async (email, password) => {
    const data = await authAPI.login(email, password);
    if (data.token) setSession(setUser, data);
    return data;
  };
  const verifyLoginOtp = async (email, code) => {
    const data = await authAPI.verifyLoginOtp(email, code);
    setSession(setUser, data);
    return data;
  };

  const resendOtp = (email, purpose) => authAPI.resendOtp(email, purpose);

  // ---------- Profile ----------
  const updateProfile = async (updates) => {
    const data = await authAPI.updateMe(updates);
    setUser(data);
    return data;
  };
  const changePassword = (currentPassword, newPassword) => authAPI.changePassword(currentPassword, newPassword);
  const deleteAccount = async (password) => {
    await authAPI.deleteAccount(password);
    logout();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user, loading, requestSignup, verifySignupOtp, requestLogin, verifyLoginOtp, resendOtp,
        updateProfile, changePassword, deleteAccount, logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
