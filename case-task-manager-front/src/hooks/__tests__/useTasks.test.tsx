import { renderHook, act } from '@testing-library/react';
import { useTasks } from '../useTasks';
import { tasksApi } from '@/lib/api';
import { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '@/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  tasksApi: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mockTasksApi = tasksApi as jest.Mocked<typeof tasksApi>;

describe('useTasks', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    userId: 'user1',
    assigneeId: 'user2',
    dueDate: '2023-12-31',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockTasks: Task[] = [
    mockTask,
    {
      ...mockTask,
      id: '2',
      title: 'Second Task',
      status: 'completed',
      priority: 'high',
    },
  ];

  const mockCreateTaskData: CreateTaskData = {
    title: 'New Task',
    description: 'New Description',
    status: 'pending',
    priority: 'low',
    dueDate: '2023-12-31',
    assigneeId: 'user1',
  };

  const mockUpdateTaskData: UpdateTaskData = {
    title: 'Updated Task',
    status: 'in_progress',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should fetch tasks on mount', async () => {
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTasksApi.getTasks).toHaveBeenCalledWith({});
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.loading).toBe(false);
    });

    it('should initialize with filters', async () => {
      const initialFilters: TaskFilters = { status: 'pending', priority: 'high' };
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks(initialFilters));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTasksApi.getTasks).toHaveBeenCalledWith(initialFilters);
    });

    it('should handle fetch error on mount', async () => {
      const errorMessage = 'Failed to fetch tasks';
      mockTasksApi.getTasks.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe('Erro ao carregar tarefas');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const newTask = { ...mockTask, id: '3', title: 'New Task' };
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);
      mockTasksApi.createTask.mockResolvedValue(newTask);

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.createTask(mockCreateTaskData);
      });

      expect(mockTasksApi.createTask).toHaveBeenCalledWith(mockCreateTaskData);
      expect(result.current.tasks).toEqual([newTask, ...mockTasks]);
      expect(result.current.error).toBeNull();
    });

    it('should handle create task error', async () => {
      const errorMessage = 'Failed to create task';
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);
      mockTasksApi.createTask.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.createTask(mockCreateTaskData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Erro ao criar tarefa');
      expect(result.current.tasks).toEqual(mockTasks); // Should remain unchanged
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);
      mockTasksApi.updateTask.mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.updateTask('1', mockUpdateTaskData);
      });

      expect(mockTasksApi.updateTask).toHaveBeenCalledWith('1', mockUpdateTaskData);
      expect(result.current.tasks[0]).toEqual(updatedTask);
      expect(result.current.error).toBeNull();
    });

    it('should handle update task error', async () => {
      const errorMessage = 'Failed to update task';
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);
      mockTasksApi.updateTask.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.updateTask('1', mockUpdateTaskData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Erro ao atualizar tarefa');
      expect(result.current.tasks).toEqual(mockTasks); // Should remain unchanged
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);
      mockTasksApi.deleteTask.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.deleteTask('1');
      });

      expect(mockTasksApi.deleteTask).toHaveBeenCalledWith('1');
      expect(result.current.tasks).toEqual([mockTasks[1]]); // First task should be removed
      expect(result.current.error).toBeNull();
    });

    it('should handle delete task error', async () => {
      const errorMessage = 'Failed to delete task';
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);
      mockTasksApi.deleteTask.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.deleteTask('1');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Erro ao excluir tarefa');
      expect(result.current.tasks).toEqual(mockTasks); // Should remain unchanged
    });
  });

  describe('refreshTasks', () => {
    it('should refresh tasks successfully', async () => {
      const newTasks = [{ ...mockTask, id: '3', title: 'Refreshed Task' }];
      mockTasksApi.getTasks.mockResolvedValueOnce(mockTasks);
      mockTasksApi.getTasks.mockResolvedValueOnce(newTasks);

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.tasks).toEqual(mockTasks);

      await act(async () => {
        await result.current.refreshTasks();
      });

      expect(mockTasksApi.getTasks).toHaveBeenCalledTimes(2);
      expect(result.current.tasks).toEqual(newTasks);
    });

    it('should handle refresh error', async () => {
      mockTasksApi.getTasks.mockResolvedValueOnce(mockTasks);
      mockTasksApi.getTasks.mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.refreshTasks();
      });

      expect(result.current.error).toBe('Erro ao carregar tarefas');
    });
  });

  describe('setFilters', () => {
    it('should update filters and refetch tasks', async () => {
      const newFilters: TaskFilters = { status: 'completed' };
      mockTasksApi.getTasks.mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTasksApi.getTasks).toHaveBeenCalledWith({});

      act(() => {
        result.current.setFilters(newFilters);
      });

      // Wait for refetch with new filters
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockTasksApi.getTasks).toHaveBeenCalledWith(newFilters);
    });
  });

  describe('loading states', () => {
    it('should set loading to true during fetch', async () => {
      let resolveFetch: (value: Task[]) => void;
      const fetchPromise = new Promise<Task[]>(resolve => {
        resolveFetch = resolve;
      });
      mockTasksApi.getTasks.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useTasks());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveFetch(mockTasks);
        await fetchPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('should clear error when starting new operations', async () => {
      // First, create an error
      mockTasksApi.getTasks.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBeTruthy();

      // Now perform a successful operation
      mockTasksApi.createTask.mockResolvedValue(mockTask);

      await act(async () => {
        await result.current.createTask(mockCreateTaskData);
      });

      expect(result.current.error).toBeNull();
    });
  });
});