// context/AuthContext.tsx - Context para manejar autenticación
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage, StorageKeys } from '../utils/storage';

interface User {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await storage.getItem(StorageKeys.TOKEN);
      const storedUser = await storage.getItem(StorageKeys.USER);

      console.log('Stored token:', storedToken ? 'exists' : 'not found');
      console.log('Stored user:', storedUser ? 'exists' : 'not found');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Parsed user:', parsedUser);
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    try {
      console.log('Login - Token:', newToken ? 'exists' : 'not found');
      console.log('Login - User:', newUser);
      
      await storage.setItem(StorageKeys.TOKEN, newToken);
      await storage.setItem(StorageKeys.USER, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      
      console.log('Login - User set in context:', newUser);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await storage.setItem(StorageKeys.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await storage.removeItem(StorageKeys.TOKEN);
      await storage.removeItem(StorageKeys.USER);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    updateUser,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};