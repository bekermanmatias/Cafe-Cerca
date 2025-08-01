// context/AuthContext.tsx - Context para manejar autenticación
import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
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

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      logout(); // <- esto también debería hacer setIsLoading(false)
    }
  } catch (error) {
    console.error('Error en checkAuthState', error);
  } finally {
    setIsLoading(false); // ✅ asegurate de que esto SIEMPRE se llame
  }
};

const login = useMemo(() => async (newToken: string, newUser: User) => {
  try {
    console.log('Saving user:', newUser); // <-- log útil
    await storage.setItem(StorageKeys.TOKEN, newToken);
    await storage.setItem(StorageKeys.USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}, []);

  const updateUser = useMemo(() => async (updatedUser: User) => {
    try {
      await storage.setItem(StorageKeys.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, []);

  const logout = useMemo(() => async () => {
    try {
      await storage.removeItem(StorageKeys.TOKEN);
      await storage.removeItem(StorageKeys.USER);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  // Memoizar el value del contexto para evitar re-renders innecesarios
  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    login,
    updateUser,
    logout,
    isLoading,
  }), [user, token, login, updateUser, logout, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};