import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'mom_users';
const SESSION_KEY = 'mom_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): Record<string, { name: string; password: string }> => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = getUsers();
    const record = users[email.toLowerCase()];
    if (!record || record.password !== password) return false;

    const loggedIn: User = { email: email.toLowerCase(), name: record.name };
    setUser(loggedIn);
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedIn));
    return true;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) return false; // already exists

    users[key] = { name, password };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const loggedIn: User = { email: key, name };
    setUser(loggedIn);
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedIn));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
