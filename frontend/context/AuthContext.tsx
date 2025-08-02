// context/AuthContext.tsx - Context para manejar autenticación
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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

  const checkAuthState = useCallback(async () => {
    try {
      const storedToken = await storage.getItem(StorageKeys.TOKEN);
      const storedUser = await storage.getItem(StorageKeys.USER);

             // Verificar que el token no esté corrupto
       if (storedToken === '[object Object]' || (storedToken && storedToken.includes('"id"'))) {
         console.log('❌ Token corrupto detectado en AuthContext, limpiando...');
         console.log('❌ Token corrupto:', storedToken);
         await storage.removeItem(StorageKeys.TOKEN);
         await storage.removeItem(StorageKeys.USER);
         setToken(null);
         setUser(null);
         return;
       }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Limpiar estado sin llamar a logout para evitar recursión
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error en checkAuthState', error);
      // En caso de error, también limpiar el estado
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const login = useCallback(async (newToken: string, newUser: User) => {
    try {
      console.log('🔐 LOGIN llamado con:');
      console.log('🔐 User:', newUser);
      console.log('🔐 Token type:', typeof newToken);
      console.log('🔐 Token preview:', newToken ? newToken.substring(0, 50) + '...' : 'null');
      
      // Stack trace para debug
      console.log('🔐 Stack trace:', new Error().stack);
      
      // Verificar que los parámetros no sean undefined
      if (!newToken || !newUser) {
        console.error('❌ Error: Token o User son undefined');
        console.error('❌ Token:', newToken);
        console.error('❌ User:', newUser);
        throw new Error('Token y User no pueden ser undefined');
      }
      
      // Verificar que newToken sea realmente un token JWT, no un objeto usuario
      if (typeof newToken === 'object') {
        console.error('❌ Error: Se está intentando guardar un objeto como token');
        throw new Error('Token inválido: se está guardando un objeto en lugar del token JWT');
      }
      
      // Verificar que no sea un objeto JSON stringificado
      if (typeof newToken === 'string' && (newToken.includes('"id"') || newToken.startsWith('{'))) {
        console.error('❌ Error: Se está intentando guardar un objeto JSON como token');
        throw new Error('Token inválido: se está guardando un objeto JSON en lugar del token JWT');
      }
      
      // Asegurar que el token sea string
      const tokenString = typeof newToken === 'string' ? newToken : JSON.stringify(newToken);
      
      await storage.setItem(StorageKeys.TOKEN, tokenString);
      await storage.setItem(StorageKeys.USER, JSON.stringify(newUser));
      setToken(tokenString);
      setUser(newUser);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
      console.log('🔄 Actualizando usuario en AuthContext:', updatedUser);
      
      // Verificar que el usuario no sea undefined o null
      if (!updatedUser) {
        console.error('❌ Error: updatedUser es undefined o null');
        throw new Error('Usuario no puede ser undefined');
      }
      
      await storage.setItem(StorageKeys.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log('✅ Usuario actualizado exitosamente en AuthContext');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('Logging out user...');
      await storage.removeItem(StorageKeys.TOKEN);
      await storage.removeItem(StorageKeys.USER);
      setToken(null);
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Asegurar que el estado se limpie incluso si hay error
      setToken(null);
      setUser(null);
    }
  }, []);

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