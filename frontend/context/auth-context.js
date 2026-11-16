'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const savedToken = window.localStorage.getItem('roadeye_token');
    const savedUser = window.localStorage.getItem('roadeye_user');

    if (savedToken) {
      setToken(savedToken);
      api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Unable to parse saved auth user', error);
        window.localStorage.removeItem('roadeye_user');
      }
    }

    setLoading(false);
  }, []);

  const saveSession = (authToken, authUser) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('roadeye_token', authToken);
      window.localStorage.setItem('roadeye_user', JSON.stringify(authUser));
    }

    setToken(authToken);
    setUser(authUser);
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('roadeye_token');
      window.localStorage.removeItem('roadeye_user');
    }

    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();

    window.addEventListener('roadeye:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('roadeye:unauthorized', handleUnauthorized);
  }, []);

  const refreshProfile = async () => {
    if (!token) return null;

    try {
      const response = await api.get('/users/profile');
      const nextUser = response.data?.user || null;

      if (nextUser) {
        setUser(nextUser);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('roadeye_user', JSON.stringify(nextUser));
        }
      }

      return nextUser;
    } catch (error) {
      console.error('Profile refresh failed', error);
      logout();
      return null;
    }
  };

  const value = useMemo(
    () => ({ user, token, loading, isMounted, setUser, saveSession, logout, refreshProfile }),
    [user, token, loading, isMounted]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
