import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'lingoflow_user';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  address?: string;
  phone?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function callAuthAPI(endpoint: string, body: object): Promise<User> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed.');
  return data as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUser = (data: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  };

  // Google OAuth login – decodes the JWT from Google then calls our backend
  const login = async (credential: string) => {
    const decoded: any = jwtDecode(credential);
    const { email, name, picture } = decoded;
    const data = await callAuthAPI('/api/auth/google', { email, name, picture });
    saveUser(data);
  };

  // Email/password login
  const loginWithEmail = async (email: string, password: string) => {
    const data = await callAuthAPI('/api/auth/login', { email, password });
    saveUser(data);
  };

  // Email/password register
  const registerWithEmail = async (name: string, email: string, password: string) => {
    const data = await callAuthAPI('/api/auth/register', { name, email, password });
    saveUser(data);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = (data: User) => {
    saveUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithEmail, registerWithEmail, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
