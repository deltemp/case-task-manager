import { renderHook, act } from '@testing-library/react';
import { useAuthProvider } from '../useAuth';
import { authApi } from '@/lib/api';
import { User, LoginData, RegisterData } from '@/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number, public data?: any) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAuthProvider', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockLoginData: LoginData = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRegisterData: RegisterData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      // Note: loading state may be false immediately if no token exists
    });

    it('should check auth status on mount when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthProvider());

      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockAuthApi.getCurrentUser).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should not call getCurrentUser when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuthProvider());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockAuthApi.getCurrentUser).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockAuthApi.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

      const { result } = renderHook(() => useAuthProvider());

      await act(async () => {
        await result.current.login(mockLoginData);
      });

      expect(mockAuthApi.login).toHaveBeenCalledWith(mockLoginData);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthApi.login.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthProvider());

      await act(async () => {
        try {
          await result.current.login(mockLoginData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Erro ao fazer login');
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      mockAuthApi.login.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthProvider());

      act(() => {
        result.current.login(mockLoginData);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveLogin({ user: mockUser, token: 'mock-token' });
        await loginPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      mockAuthApi.register.mockResolvedValue({ message: 'User registered' });

      const { result } = renderHook(() => useAuthProvider());

      await act(async () => {
        await result.current.register(mockRegisterData);
      });

      expect(mockAuthApi.register).toHaveBeenCalledWith(mockRegisterData);
      expect(result.current.user).toBeNull(); // Register doesn't auto-login
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle register error', async () => {
      const errorMessage = 'Email already exists';
      mockAuthApi.register.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthProvider());

      await act(async () => {
        try {
          await result.current.register(mockRegisterData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Erro ao registrar usuário');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthApi.logout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthProvider());

      // Set initial user state
      await act(async () => {
        await result.current.login(mockLoginData);
      });

      mockAuthApi.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthApi.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear user state even if logout API fails', async () => {
      mockAuthApi.logout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthProvider());

      // Set initial user state
      mockAuthApi.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });
      await act(async () => {
        await result.current.login(mockLoginData);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockAuthApi.login.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuthProvider());

      // Create an error
      await act(async () => {
        try {
          await result.current.login(mockLoginData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user state', () => {
      const { result } = renderHook(() => useAuthProvider());

      const updatedUser = { ...mockUser, name: 'Updated Name' };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('auth status check', () => {
    it('should handle invalid token by clearing localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      mockAuthApi.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuthProvider());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });
});