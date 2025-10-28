import { authApi, tasksApi, usersApi, ApiError } from '../api';
import { LoginData, RegisterData, CreateTaskData, UpdateTaskData, TaskFilters, User, Task } from '@/types';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console.error to avoid noise in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('API Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ApiError', () => {
    it('should create ApiError with message, status, and data', () => {
      const error = new ApiError('Test error', 400, { field: 'value' });
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.data).toEqual({ field: 'value' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('makeRequest utility', () => {
    it('should make request with auth token when available', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      await authApi.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make request without auth token when not available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ user: {}, access_token: 'token' }),
      } as Response);

      await authApi.login({ email: 'test@example.com', password: 'password' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });

    it('should handle JSON response', async () => {
      const mockData = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      } as Response);

      const result = await authApi.getCurrentUser();
      expect(result).toEqual(mockData);
    });

    it('should handle text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Success',
      } as Response);

      await tasksApi.deleteTask('1');
      // Should not throw error
    });

    it('should throw ApiError for HTTP errors with JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Validation failed' }),
      } as Response);

      await expect(authApi.getCurrentUser()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for HTTP errors with text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Server error',
      } as Response);

      await expect(authApi.getCurrentUser()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authApi.getCurrentUser()).rejects.toThrow(ApiError);
    });
  });

  describe('authApi', () => {
    describe('login', () => {
      it('should login successfully and store token', async () => {
        const loginData: LoginData = { email: 'test@example.com', password: 'password' };
        const mockResponse = {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          access_token: 'test-token'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        } as Response);

        const result = await authApi.login(loginData);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(loginData),
          })
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
        expect(result).toEqual({
          user: mockResponse.user,
          token: 'test-token'
        });
      });

      it('should handle login error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ message: 'Invalid credentials' }),
        } as Response);

        await expect(authApi.login({ email: 'test@example.com', password: 'wrong' }))
          .rejects.toThrow('Invalid credentials');
      });
    });

    describe('register', () => {
      it('should register successfully', async () => {
        const registerData: RegisterData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password'
        };
        const mockResponse = {
          user: { id: '1', email: 'test@example.com', name: 'Test User' }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        } as Response);

        const result = await authApi.register(registerData);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(registerData),
          })
        );
        expect(result).toEqual({
          user: mockResponse.user,
          token: ''
        });
      });
    });

    describe('logout', () => {
      it('should remove token from localStorage', async () => {
        await authApi.logout();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      });
    });

    describe('getCurrentUser', () => {
      it('should get current user', async () => {
        const mockUser: User = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockUser,
        } as Response);

        const result = await authApi.getCurrentUser();
        expect(result).toEqual(mockUser);
      });
    });

    describe('refreshToken', () => {
      it('should refresh token and store new one', async () => {
        const mockResponse = {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          access_token: 'new-token'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResponse,
        } as Response);

        const result = await authApi.refreshToken();

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
        expect(result).toEqual({
          user: mockResponse.user,
          token: 'new-token'
        });
      });
    });
  });

  describe('tasksApi', () => {
    describe('getTasks', () => {
      it('should get tasks without filters', async () => {
        const mockTasks: Task[] = [
          {
            id: '1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'pending',
            priority: 'high',
            userId: '1',
            assigneeId: '1',
            dueDate: '2023-12-31',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockTasks,
        } as Response);

        const result = await tasksApi.getTasks();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks',
          expect.any(Object)
        );
        expect(result).toEqual(mockTasks);
      });

      it('should get tasks with filters', async () => {
        const filters: TaskFilters = {
          status: 'pending',
          priority: 'high',
          search: 'test'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [],
        } as Response);

        await tasksApi.getTasks(filters);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks?status=pending&priority=high&search=test',
          expect.any(Object)
        );
      });

      it('should handle filters with undefined values', async () => {
        const filters: TaskFilters = {
          status: 'pending',
          priority: undefined,
          search: null as any
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [],
        } as Response);

        await tasksApi.getTasks(filters);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks?status=pending',
          expect.any(Object)
        );
      });
    });

    describe('getTask', () => {
      it('should get single task', async () => {
        const mockTask: Task = {
          id: '1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending',
          priority: 'high',
          userId: '1',
          assigneeId: '1',
          dueDate: '2023-12-31',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockTask,
        } as Response);

        const result = await tasksApi.getTask('1');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks/1',
          expect.any(Object)
        );
        expect(result).toEqual(mockTask);
      });
    });

    describe('createTask', () => {
      it('should create task', async () => {
        const createData: CreateTaskData = {
          title: 'New Task',
          description: 'New Description',
          status: 'pending',
          priority: 'medium'
        };

        const mockTask: Task = {
          id: '1',
          ...createData,
          userId: '1',
          assigneeId: '1',
          dueDate: '2023-12-31',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockTask,
        } as Response);

        const result = await tasksApi.createTask(createData);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(createData),
          })
        );
        expect(result).toEqual(mockTask);
      });
    });

    describe('updateTask', () => {
      it('should update task', async () => {
        const updateData: UpdateTaskData = {
          title: 'Updated Task',
          status: 'completed'
        };

        const mockTask: Task = {
          id: '1',
          title: 'Updated Task',
          description: 'Description',
          status: 'completed',
          priority: 'medium',
          userId: '1',
          assigneeId: '1',
          dueDate: '2023-12-31',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockTask,
        } as Response);

        const result = await tasksApi.updateTask('1', updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks/1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockTask);
      });
    });

    describe('deleteTask', () => {
      it('should delete task', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
        } as Response);

        await tasksApi.deleteTask('1');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/tasks/1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('usersApi', () => {
    describe('getUsers', () => {
      it('should get all users', async () => {
        const mockUsers: User[] = [
          {
            id: '1',
            email: 'user1@example.com',
            name: 'User 1',
            role: 'user',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockUsers,
        } as Response);

        const result = await usersApi.getUsers();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/users',
          expect.any(Object)
        );
        expect(result).toEqual(mockUsers);
      });
    });

    describe('getUser', () => {
      it('should get single user', async () => {
        const mockUser: User = {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'user',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockUser,
        } as Response);

        const result = await usersApi.getUser('1');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/users/1',
          expect.any(Object)
        );
        expect(result).toEqual(mockUser);
      });
    });

    describe('updateProfile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          email: 'updated@example.com'
        };

        const mockUser: User = {
          id: '1',
          email: 'updated@example.com',
          name: 'Updated Name',
          role: 'user',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockUser,
        } as Response);

        const result = await usersApi.updateProfile('1', updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/users/1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockUser);
      });
    });
  });
});