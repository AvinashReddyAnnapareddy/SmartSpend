import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import api, { getMe } from './api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
}

export interface Account {
  username: string;
  email: string;
  token: string;
}

export interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  accounts: Account[];
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  switchAccount: (username: string) => void;
  removeAccount: (username: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const tokenRef = useRef<string | null>(token);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const switchAccount = (username: string) => {
    const account = accounts.find(a => a.username === username);
    if (account) {
      localStorage.setItem('token', account.token);
      setToken(account.token);
      window.location.href = '/'; // Full reload to refresh all data
    }
  };

  const logout = () => {
    if (user) {
      const newAccounts = accounts.filter(a => a.username !== user.username);
      setAccounts(newAccounts);
      localStorage.setItem('accounts', JSON.stringify(newAccounts));

      if (newAccounts.length > 0) {
        switchAccount(newAccounts[0].username);
        return;
      }
    }

    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const fetchProfile = async (authToken: string) => {
    try {
      // Ensure request interceptor picks up the right token.
      localStorage.setItem('token', authToken);

      const profile = await getMe();
      setUser(profile);

      setAccounts(prev => {
        const existing = prev.find(a => a.username === profile.username);
        const newAccounts = existing
          ? prev.map(a => a.username === profile.username ? { ...a, token: authToken, email: profile.email } : a)
          : [...prev, { username: profile.username, email: profile.email, token: authToken }];

        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        return newAccounts;
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
      if (authToken === tokenRef.current) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/token', formData);
    const newToken = response.data.access_token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    await fetchProfile(newToken);
  };

  const register = async (username: string, email: string, password: string) => {
    await api.post('/users/', { username, email, password });
    await login(username, password);
  };

  const removeAccount = (username: string) => {
    const newAccounts = accounts.filter(a => a.username !== username);
    setAccounts(newAccounts);
    localStorage.setItem('accounts', JSON.stringify(newAccounts));

    if (user?.username === username) {
      if (newAccounts.length > 0) {
        switchAccount(newAccounts[0].username);
      } else {
        logout();
      }
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    accounts,
    login,
    register,
    logout,
    switchAccount,
    removeAccount,
    isAuthenticated: !!token,
    isLoading,
  }), [token, user, accounts, isLoading]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
