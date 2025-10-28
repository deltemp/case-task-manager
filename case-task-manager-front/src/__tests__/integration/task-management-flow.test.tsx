import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';
import DashboardPage from '@/app/(authenticated)/dashboard/page';
import { authApi, tasksApi } from '@/lib/api';
import { Task, TaskStatus, TaskPriority } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  authApi: {
    getCurrentUser: jest.fn(),
  },
  tasksApi: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock components
jest.mock('@/components/ui/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('@/components/ui/ErrorMessage', () => {
  return function MockErrorMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
      <div data-testid="error-message">
        {message}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    );
  };
});

jest.mock('@/components/ui/SuccessMessage', () => {
  return function MockSuccessMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
      <div data-testid="success-message">
        {message}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    );
  };
});

// Mock TaskModal with form functionality
jest.mock('@/components/modals/TaskModal', () => {
  return function MockTaskModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    task, 
    isLoading 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSubmit: (data: any) => void; 
    task?: Task; 
    isLoading: boolean;
  }) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="task-modal">
        <h2>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          onSubmit({
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status') || 'pending',
        priority: formData.get('priority') || 'medium',
            due_date: formData.get('due_date'),
          });
        }}>
          <input 
            name="title" 
            placeholder="Título" 
            defaultValue={task?.title || ''} 
            required 
          />
          <textarea 
            name="description" 
            placeholder="Descrição" 
            defaultValue={task?.description || ''} 
          />
          <select name="status" defaultValue={task?.status || 'pending'}>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Progresso</option>
            <option value="completed">Concluída</option>
          </select>
          <select name="priority" defaultValue={task?.priority || 'medium'}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
          <input 
            name="due_date" 
            type="date" 
            defaultValue={task?.due_date || ''} 
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    );
  };
});

// Mock DeleteConfirmModal
jest.mock('@/components/modals/DeleteConfirmModal', () => {
  return function MockDeleteConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isLoading 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void; 
    isLoading: boolean;
  }) {
    if (!isOpen) return null;
    
    return (
      <div data-testid="delete-confirm-modal">
        <h2>Confirmar Exclusão</h2>
        <p>Tem certeza que deseja excluir esta tarefa?</p>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Excluindo...' : 'Excluir'}
        </button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    );
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Task 1',
    description: 'Description 1',
    status: 'pending',
    priority: 'high',
    due_date: '2024-01-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 1,
  },
  {
    id: 2,
    title: 'Task 2',
    description: 'Description 2',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2024-01-20',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    user_id: 1,
  },
  {
    id: 3,
    title: 'Task 3',
    description: 'Description 3',
    status: 'completed',
    priority: 'low',
    due_date: '2024-01-10',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    user_id: 1,
  },
];

describe('Task Management Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    });
    
    (tasksApi.getTasks as jest.Mock).mockResolvedValue(mockTasks);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Task Creation Flow', () => {
    it('should create a new task successfully', async () => {
      const user = userEvent.setup();
      const newTask = {
        id: 4,
        title: 'New Task',
        description: 'New Description',
        status: 'pending',
        priority: 'high',
        due_date: '2024-02-01',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        user_id: 1,
      };

      (tasksApi.createTask as jest.Mock).mockResolvedValue(newTask);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Click create task button
      const createButton = screen.getByRole('button', { name: /nova tarefa/i });
      await user.click(createButton);

      // Verify modal is open
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
      expect(screen.getByText('Nova Tarefa')).toBeInTheDocument();

      // Fill in task form
      const titleInput = screen.getByPlaceholderText('Título');
      const descriptionInput = screen.getByPlaceholderText('Descrição');
      const statusSelect = screen.getByDisplayValue('Pendente');
      const prioritySelect = screen.getByDisplayValue('Média');
      const dueDateInput = screen.getByDisplayValue('');

      await user.type(titleInput, 'New Task');
      await user.type(descriptionInput, 'New Description');
      await user.selectOptions(prioritySelect, 'high');
      await user.type(dueDateInput, '2024-02-01');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify API was called
      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalledWith({
          title: 'New Task',
          description: 'New Description',
          status: 'pending',
          priority: 'high',
          due_date: '2024-02-01',
        });
      });

      // Verify success message
      expect(screen.getByTestId('success-message')).toBeInTheDocument();

      // Verify tasks are reloaded
      expect(tasksApi.getTasks).toHaveBeenCalledTimes(2);
    });

    it('should handle task creation failure', async () => {
      const user = userEvent.setup();
      
      (tasksApi.createTask as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Open create modal and submit
      const createButton = screen.getByRole('button', { name: /nova tarefa/i });
      await user.click(createButton);

      const titleInput = screen.getByPlaceholderText('Título');
      await user.type(titleInput, 'New Task');

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Task Update Flow', () => {
    it('should update an existing task successfully', async () => {
      const user = userEvent.setup();
      const updatedTask = {
        ...mockTasks[0],
        title: 'Updated Task',
        status: 'in_progress',
      };

      (tasksApi.updateTask as jest.Mock).mockResolvedValue(updatedTask);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Click edit button for first task
      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      await user.click(editButtons[0]);

      // Verify modal is open with existing data
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
      expect(screen.getByText('Editar Tarefa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Task 1')).toBeInTheDocument();

      // Update task
      const titleInput = screen.getByDisplayValue('Task 1');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      const statusSelect = screen.getByDisplayValue('Pendente');
      await user.selectOptions(statusSelect, 'in_progress');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify API was called
      await waitFor(() => {
        expect(tasksApi.updateTask).toHaveBeenCalledWith(1, {
          title: 'Updated Task',
          description: 'Description 1',
          status: 'in_progress',
          priority: 'high',
          due_date: '2024-01-15',
        });
      });

      // Verify success message
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  describe('Task Deletion Flow', () => {
    it('should delete a task successfully', async () => {
      const user = userEvent.setup();
      
      (tasksApi.deleteTask as jest.Mock).mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Click delete button for first task
      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
      await user.click(deleteButtons[0]);

      // Verify confirmation modal is open
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^excluir$/i });
      await user.click(confirmButton);

      // Verify API was called
      await waitFor(() => {
        expect(tasksApi.deleteTask).toHaveBeenCalledWith(1);
      });

      // Verify success message
      expect(screen.getByTestId('success-message')).toBeInTheDocument();

      // Verify tasks are reloaded
      expect(tasksApi.getTasks).toHaveBeenCalledTimes(2);
    });

    it('should handle task deletion cancellation', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Click delete button for first task
      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
      await user.click(deleteButtons[0]);

      // Verify confirmation modal is open
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      // Verify modal is closed and API was not called
      expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
      expect(tasksApi.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe('Task Filtering Flow', () => {
    it('should filter tasks by search term', async () => {
      const user = userEvent.setup();
      const filteredTasks = [mockTasks[0]]; // Only Task 1

      (tasksApi.getTasks as jest.Mock)
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce(filteredTasks); // After search

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
        expect(screen.getByText('Task 3')).toBeInTheDocument();
      });

      // Search for specific task
      const searchInput = screen.getByPlaceholderText(/buscar tarefas/i);
      await user.type(searchInput, 'Task 1');

      // Verify API was called with search filter
      await waitFor(() => {
        expect(tasksApi.getTasks).toHaveBeenCalledWith({ search: 'Task 1' });
      });
    });

    it('should filter tasks by status', async () => {
      const user = userEvent.setup();
      const filteredTasks = [mockTasks[1]]; // Only IN_PROGRESS task

      (tasksApi.getTasks as jest.Mock)
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce(filteredTasks); // After filter

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Filter by status
      const statusFilter = screen.getByDisplayValue(/todos os status/i);
      await user.selectOptions(statusFilter, 'in_progress');

      // Verify API was called with status filter
      await waitFor(() => {
        expect(tasksApi.getTasks).toHaveBeenCalledWith({ status: 'in_progress' });
      });
    });

    it('should filter tasks by priority', async () => {
      const user = userEvent.setup();
      const filteredTasks = [mockTasks[0]]; // Only HIGH priority task

      (tasksApi.getTasks as jest.Mock)
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce(filteredTasks); // After filter

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Filter by priority
      const priorityFilter = screen.getByDisplayValue(/todas as prioridades/i);
      await user.selectOptions(priorityFilter, 'high');

      // Verify API was called with priority filter
      await waitFor(() => {
        expect(tasksApi.getTasks).toHaveBeenCalledWith({ priority: 'high' });
      });
    });

    it('should combine multiple filters', async () => {
      const user = userEvent.setup();
      const filteredTasks: Task[] = [];

      (tasksApi.getTasks as jest.Mock)
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce(filteredTasks); // After combined filters

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText(/buscar tarefas/i);
      const statusFilter = screen.getByDisplayValue(/todos os status/i);
      const priorityFilter = screen.getByDisplayValue(/todas as prioridades/i);

      await user.type(searchInput, 'Task');
      await user.selectOptions(statusFilter, 'pending');
      await user.selectOptions(priorityFilter, 'high');

      // Verify API was called with combined filters
      await waitFor(() => {
        expect(tasksApi.getTasks).toHaveBeenCalledWith({
          search: 'Task',
          status: 'pending',
          priority: 'high',
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle task loading failure', async () => {
      (tasksApi.getTasks as jest.Mock).mockRejectedValue(new Error('Failed to load tasks'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      (tasksApi.getTasks as jest.Mock).mockResolvedValue(mockTasks);
      (tasksApi.createTask as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Try to create a task
      const createButton = screen.getByRole('button', { name: /nova tarefa/i });
      await user.click(createButton);

      const titleInput = screen.getByPlaceholderText('Título');
      await user.type(titleInput, 'New Task');

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify error is handled gracefully
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Verify modal remains open for user to retry
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });
  });
});