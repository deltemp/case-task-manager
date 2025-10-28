import { 
  User, 
  Task, 
  LoginData, 
  RegisterData, 
  AuthResponse, 
  ApiResponse, 
  PaginatedResponse,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    console.error('API request failed:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
};

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await makeRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }
    
    return {
      user: response.user,
      token: response.access_token
    };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await makeRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Register doesn't return token, just user data
    return {
      user: response.user,
      token: '' // Will need to login after register
    };
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    // Optional: call logout endpoint if needed
    // await makeRequest('/auth/logout', { method: 'POST' });
  },

  getCurrentUser: async (): Promise<User> => {
    return await makeRequest<User>('/auth/me');
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await makeRequest<any>('/auth/refresh', {
      method: 'POST',
    });
    
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }
    
    return {
      user: response.user,
      token: response.access_token
    };
  },
};

export const tasksApi = {
  getTasks: async (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    
    return await makeRequest<Task[]>(endpoint);
  },

  getTask: async (id: string): Promise<Task> => {
    return await makeRequest<Task>(`/tasks/${id}`);
  },

  createTask: async (data: CreateTaskData): Promise<Task> => {
    return await makeRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTask: async (id: string, data: UpdateTaskData): Promise<Task> => {
    return await makeRequest<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteTask: async (id: string): Promise<void> => {
    await makeRequest<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    return await makeRequest<User[]>('/users');
  },

  getUser: async (id: string): Promise<User> => {
    return await makeRequest<User>(`/users/${id}`);
  },

  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    return await makeRequest<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export const api = {
  auth: authApi,
  tasks: tasksApi,
  users: usersApi,
};

export default api;