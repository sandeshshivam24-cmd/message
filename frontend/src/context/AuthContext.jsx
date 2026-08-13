import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Read active authentication token from sessionStorage (or localStorage fallback)
  const [token, setToken] = useState(() => sessionStorage.getItem('messenger_token') || localStorage.getItem('messenger_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const activeToken = sessionStorage.getItem('messenger_token') || localStorage.getItem('messenger_token');

      if (activeToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
        } catch (error) {
          console.error('Auth verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token: newToken, user: userData } = res.data;
    sessionStorage.setItem('messenger_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const { token: newToken, user: userData } = res.data;
    sessionStorage.setItem('messenger_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    sessionStorage.removeItem('messenger_token');
    localStorage.removeItem('messenger_token');
    localStorage.removeItem('messenger_jwt_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
