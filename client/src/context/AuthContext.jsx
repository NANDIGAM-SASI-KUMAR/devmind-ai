import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/auth.js';

const AuthContext = createContext(null);

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

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, avatar: data.avatar });
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await authAPI.signup(name, email, password);
    localStorage.setItem('token', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, avatar: data.avatar });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
