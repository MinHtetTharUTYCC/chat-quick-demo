import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { api } from '../services/mockBackend';

interface AuthContextType extends AuthState {
  login: (username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for simulated persistence
    const storedToken = localStorage.getItem('nestchat_token');
    const storedUser = localStorage.getItem('nestchat_user');
    
    if (storedToken && storedUser) {
      setState({
        token: storedToken,
        user: JSON.parse(storedUser),
        isAuthenticated: true,
      });
    }
    setLoading(false);
  }, []);

  const login = async (username: string) => {
    try {
      const response = await api.login(username);
      localStorage.setItem('nestchat_token', response.token);
      localStorage.setItem('nestchat_user', JSON.stringify(response.user));
      
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('nestchat_token');
    localStorage.removeItem('nestchat_user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-indigo-500">Loading App...</div>;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
