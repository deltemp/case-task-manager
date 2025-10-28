import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { tasksApi } from '@/lib/api';
import { Task, User } from '@/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  tasksApi: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock components
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/ui/ErrorMessage', () => ({
  ErrorMessage: ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
    <div data-testid="error-message">
      {message}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

jest.mock('@/components/ui/SuccessMessage', () => ({
  SuccessMessage: ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
    <div data-testid="success-message">
      {message}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

jest.mock('@/components/modals/TaskModal', () => ({
  TaskModal: ({ isOpen, onClose, onSubmit, mode, task }: any) => (
    isOpen ? (
      <div data-testid="task-modal" data-mode={mode}>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ title: 'Test Task', status: 'pending', priority: 'medium' })}>
          Submit
        </button>
        {task && <div data-testid="editing-task">{task.title}</div>}
      </div>
    ) : null
  ),
}));

jest.mock('@/components/modals/DeleteConfirmModal', () => ({
  DeleteConfirmModal: ({ isOpen, onClose, onConfirm, title }: any) => (
    isOpen ? (
      <div data-testid="delete-modal">
        <div data-testid="delete-title">{title}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null
  ),
}));

const mockTasksApi = tasksApi as jest.Mocked<typeof tasksApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DashboardPage', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

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
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'completed',
      priority: 'medium',
      userId: '1',
      assigneeId: '1',
      dueDate: '2023-12-31',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      updateUser: jest.fn(),
    });

    mockTasksApi.getTasks.mockResolvedValue(mockTasks);
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render loading spinner initially', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should load and display tasks', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockTasksApi.getTasks).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('should display error message when loading tasks fails', async () => {
    mockTasksApi.getTasks.mockRejectedValue(new Error('Failed to load tasks'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar tarefas. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('should filter tasks by search term', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar tarefas...');
    fireEvent.change(searchInput, { target: { value: 'Task 1' } });

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });
  });

  it('should filter tasks by status', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    const statusFilter = screen.getByDisplayValue('Todos');
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  it('should filter tasks by priority', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    const priorityFilter = screen.getByDisplayValue('Todas');
    fireEvent.change(priorityFilter, { target: { value: 'high' } });

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });
  });

  it('should open create task modal when create button is clicked', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const createButton = screen.getByText('Nova Tarefa');
    fireEvent.click(createButton);

    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    expect(screen.getByTestId('task-modal')).toHaveAttribute('data-mode', 'create');
  });

  it('should open edit task modal when edit button is clicked', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Find and click the dropdown button for the first task
    const dropdownButtons = screen.getAllByTestId('task-dropdown');
    fireEvent.click(dropdownButtons[0]);

    // Click edit button
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    expect(screen.getByTestId('task-modal')).toHaveAttribute('data-mode', 'edit');
    expect(screen.getByTestId('editing-task')).toHaveTextContent('Task 1');
  });

  it('should open delete confirmation modal when delete button is clicked', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Find and click the dropdown button for the first task
    const dropdownButtons = screen.getAllByTestId('task-dropdown');
    fireEvent.click(dropdownButtons[0]);

    // Click delete button
    const deleteButton = screen.getByText('Excluir');
    fireEvent.click(deleteButton);

    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    expect(screen.getByTestId('delete-title')).toHaveTextContent('Task 1');
  });

  it('should create new task successfully', async () => {
    const newTask = { ...mockTasks[0], id: '3', title: 'New Task' };
    mockTasksApi.createTask.mockResolvedValue(newTask);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open create modal
    const createButton = screen.getByText('Nova Tarefa');
    fireEvent.click(createButton);

    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTasksApi.createTask).toHaveBeenCalledWith({
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
      });
    });

    expect(screen.getByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByText('Tarefa criada com sucesso!')).toBeInTheDocument();
  });

  it('should update task successfully', async () => {
    const updatedTask = { ...mockTasks[0], title: 'Updated Task' };
    mockTasksApi.updateTask.mockResolvedValue(updatedTask);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Open edit modal
    const dropdownButtons = screen.getAllByTestId('task-dropdown');
    fireEvent.click(dropdownButtons[0]);
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTasksApi.updateTask).toHaveBeenCalledWith('1', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
      });
    });

    expect(screen.getByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByText('Tarefa atualizada com sucesso!')).toBeInTheDocument();
  });

  it('should delete task successfully', async () => {
    mockTasksApi.deleteTask.mockResolvedValue(undefined);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Open delete modal
    const dropdownButtons = screen.getAllByTestId('task-dropdown');
    fireEvent.click(dropdownButtons[0]);
    const deleteButton = screen.getByText('Excluir');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockTasksApi.deleteTask).toHaveBeenCalledWith('1');
    });

    expect(screen.getByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByText('Tarefa excluída com sucesso!')).toBeInTheDocument();
  });

  it('should handle task creation error', async () => {
    mockTasksApi.createTask.mockRejectedValue(new Error('Failed to create task'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open create modal and submit
    const createButton = screen.getByText('Nova Tarefa');
    fireEvent.click(createButton);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Erro ao salvar tarefa. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('should close modals when close buttons are clicked', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Test task modal close
    const createButton = screen.getByText('Nova Tarefa');
    fireEvent.click(createButton);
    expect(screen.getByTestId('task-modal')).toBeInTheDocument();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
  });

  it('should dismiss error and success messages', async () => {
    mockTasksApi.getTasks.mockRejectedValue(new Error('Failed to load'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('should display welcome message with user name', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText(`Bem-vindo, ${mockUser.name}!`)).toBeInTheDocument();
  });
});