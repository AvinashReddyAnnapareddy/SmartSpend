import { useState, useEffect } from 'react';
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

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (authToken: string) => {
    try {
      // Temporarily set token in localStorage for the request interceptor if not already there
      localStorage.setItem('token', authToken);
      const profile = await getMe();
      setUser(profile);
      
      // Update accounts list with the latest profile info
      setAccounts(prev => {
        const existing = prev.find(a => a.username === profile.username);
        let newAccounts;
        if (existing) {
          newAccounts = prev.map(a => a.username === profile.username ? { ...a, token: authToken, email: profile.email } : a);
        } else {
          newAccounts = [...prev, { username: profile.username, email: profile.email, token: authToken }];
        }
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        return newAccounts;
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
      if (authToken === token) {
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
  
  const switchAccount = (username: string) => {
    const account = accounts.find(a => a.username === username);
    if (account) {
      localStorage.setItem('token', account.token);
      setToken(account.token);
      window.location.href = '/'; // Full reload to refresh all data
    }
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
  
  return { 
    token, 
    user, 
    accounts, 
    login, 
    register, 
    logout, 
    switchAccount, 
    removeAccount,
    isAuthenticated: !!token,
    isLoading
  };
}
