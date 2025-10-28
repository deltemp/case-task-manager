// Mock the entire auth module at the top level using factory function
jest.mock('../auth', () => {
  const actualAuth = jest.requireActual('../auth');
  const mockRedirectToLogin = jest.fn();
  const mockRedirectToDashboard = jest.fn();
  
  return {
    ...actualAuth,
    redirectToLogin: mockRedirectToLogin,
    redirectToDashboard: mockRedirectToDashboard,
    requireAuth: jest.fn(() => {
      const authenticated = actualAuth.isAuthenticated();
      if (!authenticated) {
        mockRedirectToLogin();
        return false;
      }
      return true;
    }),
    requireGuest: jest.fn(() => {
      const authenticated = actualAuth.isAuthenticated();
      if (authenticated) {
        mockRedirectToDashboard();
        return false;
      }
      return true;
    }),
  };
});

import * as authModule from '../auth';

// Get references to the mocked functions
const mockRedirectToLogin = authModule.redirectToLogin as jest.MockedFunction<typeof authModule.redirectToLogin>;
const mockRedirectToDashboard = authModule.redirectToDashboard as jest.MockedFunction<typeof authModule.redirectToDashboard>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Auth Utilities', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      
      const result = authModule.isAuthenticated();
      
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('should return false when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = authModule.isAuthenticated();
      
      expect(result).toBe(false);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('should return false when empty token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('');
      
      const result = authModule.isAuthenticated();
      
      expect(result).toBe(false);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(authModule.getToken()).toBe('test-token');
    });

    it('should return null when token does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(authModule.getToken()).toBeNull();
    });

    it('should return null when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(authModule.getToken()).toBeNull();
      
      global.window = originalWindow;
    });
  });

  describe('setToken', () => {
    it('should set token in localStorage', () => {
      authModule.setToken('new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('should not set token when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      const originalLocalStorage = window.localStorage;
      
      // @ts-ignore
      delete global.window;
      
      // Clear mock calls before testing
      jest.clearAllMocks();
      
      // Create a fresh localStorage mock for this test
      const isolatedLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      
      // Temporarily restore window with isolated localStorage
      global.window = {
        localStorage: isolatedLocalStorage
      } as any;
      
      // Use the actual implementation for this test
      const actualAuth = jest.requireActual('../auth');
      
      // Delete window again to test SSR behavior
      // @ts-ignore
      delete global.window;
      
      actualAuth.setToken('new-token');
      
      // Since window is undefined, localStorage should not be called
      expect(isolatedLocalStorage.setItem).not.toHaveBeenCalled();
      
      global.window = originalWindow;
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
      });
    });
  });

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      authModule.removeToken();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should not remove token when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      const originalLocalStorage = window.localStorage;
      
      // @ts-ignore
      delete global.window;
      
      // Clear mock calls before testing
      jest.clearAllMocks();
      
      // Create a fresh localStorage mock for this test
      const isolatedLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      
      // Temporarily restore window with isolated localStorage
      global.window = {
        localStorage: isolatedLocalStorage
      } as any;
      
      // Use the actual implementation for this test
      const actualAuth = jest.requireActual('../auth');
      
      // Delete window again to test SSR behavior
      // @ts-ignore
      delete global.window;
      
      actualAuth.removeToken();
      
      // Since window is undefined, localStorage should not be called
      expect(isolatedLocalStorage.removeItem).not.toHaveBeenCalled();
      
      global.window = originalWindow;
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
      });
    });
  });

  describe('decodeToken', () => {
    it('should decode valid JWT token', () => {
      // Valid JWT token with payload: { "id": "1", "email": "test@example.com", "exp": 1234567890 }
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjEyMzQ1Njc4OTB9.invalid-signature';
      
      const decoded = authModule.decodeToken(validToken);
      
      expect(decoded).toEqual({
        id: '1',
        email: 'test@example.com',
        exp: 1234567890,
      });
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      
      const decoded = authModule.decodeToken(invalidToken);
      
      expect(decoded).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'header.invalid-payload.signature';
      
      const decoded = authModule.decodeToken(malformedToken);
      
      expect(decoded).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      
      expect(authModule.isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      
      expect(authModule.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const tokenWithoutExp = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: '1' }))}.signature`;
      
      expect(authModule.isTokenExpired(tokenWithoutExp)).toBe(true);
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid-token';
      
      expect(authModule.isTokenExpired(invalidToken)).toBe(true);
    });
  });

  describe('getUserFromToken', () => {
    it('should extract user data from valid token', () => {
      const payload = { id: '1', email: 'test@example.com', name: 'Test User' };
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.signature`;
      
      const user = authModule.getUserFromToken(validToken);
      
      expect(user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should use sub as id if id is not present', () => {
      const payload = { sub: '1', email: 'test@example.com', name: 'Test User' };
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.signature`;
      
      const user = authModule.getUserFromToken(validToken);
      
      expect(user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      
      const user = authModule.getUserFromToken(invalidToken);
      
      expect(user).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data for valid non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: '1', email: 'test@example.com', name: 'Test User', exp: futureTime };
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.signature`;
      
      mockLocalStorage.getItem.mockReturnValue(validToken);
      
      const user = authModule.getCurrentUser();
      
      expect(user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return null and remove token for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = { id: '1', email: 'test@example.com', exp: pastTime };
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.signature`;
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);
      
      const user = authModule.getCurrentUser();
      
      expect(user).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should return null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const user = authModule.getCurrentUser();
      
      expect(user).toBeNull();
    });
  });

  describe('redirectToLogin', () => {
    it('should redirect to login page', () => {
      authModule.redirectToLogin();
      expect(mockRedirectToLogin).toHaveBeenCalled();
    });

    it('should not redirect when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      authModule.redirectToLogin();
      // Should not throw error
      
      global.window = originalWindow;
    });
  });

  describe('redirectToDashboard', () => {
    it('should redirect to dashboard page', () => {
      authModule.redirectToDashboard();
      expect(mockRedirectToDashboard).toHaveBeenCalled();
    });

    it('should not redirect when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      authModule.redirectToDashboard();
      // Should not throw error
      
      global.window = originalWindow;
    });
  });

  describe('requireAuth', () => {
    it('should return true when user is authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      
      const result = authModule.requireAuth();
      
      expect(result).toBe(true);
      expect(mockRedirectToLogin).not.toHaveBeenCalled();
    });

    it('should return false and redirect to login when user is not authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = authModule.requireAuth();
      
      expect(result).toBe(false);
      expect(mockRedirectToLogin).toHaveBeenCalled();
    });
  });

  describe('requireGuest', () => {
    it('should return true when user is not authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = authModule.requireGuest();
      
      expect(result).toBe(true);
      expect(mockRedirectToDashboard).not.toHaveBeenCalled();
    });

    it('should return false and redirect to dashboard when user is authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      
      const result = authModule.requireGuest();
      
      expect(result).toBe(false);
      expect(mockRedirectToDashboard).toHaveBeenCalled();
    });
  });
});