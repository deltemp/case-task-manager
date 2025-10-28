import { User } from '@/types';

// Auth utility functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Decode JWT token (basic implementation)
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get user from token
export const getUserFromToken = (token: string): Partial<User> | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return null;
    
    return {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

// Auth state management
export const getCurrentUser = (): Partial<User> | null => {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    removeToken();
    return null;
  }
  
  return getUserFromToken(token);
};

// Redirect helpers
export const redirectToLogin = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const redirectToDashboard = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard';
  }
};

// Auth guard for pages
export const requireAuth = (): boolean => {
  const authenticated = isAuthenticated();
  if (!authenticated) {
    redirectToLogin();
    return false;
  }
  return true;
};

// Auth guard for guest pages (login, register)
export const requireGuest = (): boolean => {
  const authenticated = isAuthenticated();
  if (authenticated) {
    redirectToDashboard();
    return false;
  }
  return true;
};