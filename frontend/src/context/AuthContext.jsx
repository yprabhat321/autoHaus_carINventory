import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const persistSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      persistSession(res.data.data);
      return true;
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Unable to log in. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await axiosClient.post('/auth/register', { name, email, password });
      persistSession(res.data.data);
      return true;
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Unable to register. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'admin',
    authError,
    loading,
    login,
    register,
    logout,
    clearAuthError: () => setAuthError(''),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
