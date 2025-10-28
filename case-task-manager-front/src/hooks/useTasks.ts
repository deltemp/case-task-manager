import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '@/types';
import { tasksApi, ApiError } from '@/lib/api';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
}

export const useTasks = (initialFilters?: TaskFilters): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TaskFilters>(initialFilters || {});

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await tasksApi.getTasks(filters);
      setTasks(fetchedTasks);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar tarefas';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createTask = useCallback(async (data: CreateTaskData) => {
    try {
      setError(null);
      const newTask = await tasksApi.createTask(data);
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao criar tarefa';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: UpdateTaskData) => {
    try {
      setError(null);
      const updatedTask = await tasksApi.updateTask(id, data);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao atualizar tarefa';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setError(null);
      await tasksApi.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao excluir tarefa';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  const setFilters = useCallback((newFilters: TaskFilters) => {
    setFiltersState(newFilters);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    setFilters,
  };
};