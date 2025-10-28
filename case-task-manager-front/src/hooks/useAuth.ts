import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, LoginData, RegisterData, AuthResponse } from '@/types';
import { authApi, ApiError } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (data: LoginData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.login(data);
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao fazer login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.register(data);
      // Note: Register doesn't automatically log in, user needs to login after
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao registrar usuário';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await authApi.logout();
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      // Even if logout fails, clear user state
      setUser(null);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error checking auth status:', err);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };
};

export { AuthContext };