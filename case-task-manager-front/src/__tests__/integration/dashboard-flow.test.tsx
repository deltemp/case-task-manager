import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';
import DashboardPage from '@/app/(authenticated)/dashboard/page';
import { authApi, tasksApi } from '@/lib/api';
import { User, Task } from '@/types';

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

jest.mock('@/components/ClientDateFormatter', () => {
  return function MockClientDateFormatter({ dateString, className }: { dateString: string; className?: string }) {
    return <span className={className}>{dateString ? '01/01/2024' : 'Sem data'}</span>;
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Task 1',
    description: 'Description 1',
    status: 'pending',
    priority: 'high',
    due_date: '2024-12-31',
    assignee_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Task 2',
    description: 'Description 2',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2024-12-25',
    assignee_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Task 3',
    description: 'Description 3',
    status: 'completed',
    priority: 'low',
    due_date: '2024-12-20',
    assignee_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Overdue Task',
    description: 'This task is overdue',
    status: 'pending',
    priority: 'high',
    due_date: '2024-01-01',
    assignee_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('Dashboard Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (tasksApi.getTasks as jest.Mock).mockResolvedValue(mockTasks);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Dashboard Overview', () => {
    it('should display welcome message and user name', async () => {
      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display task statistics', async () => {
      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/total de tarefas/i)).toBeInTheDocument();
      });

      // Verify statistics are displayed
      expect(screen.getByText('4')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText(/pendentes/i)).toBeInTheDocument();
      expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
      expect(screen.getByText(/concluídas/i)).toBeInTheDocument();
      expect(screen.getByText(/atrasadas/i)).toBeInTheDocument();
    });

    it('should display task statistics with correct counts', async () => {
      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/total de tarefas/i)).toBeInTheDocument();
      });

      // Verify specific counts (based on mockTasks)
      const pendingCount = screen.getAllByText('1').find(el => 
        el.closest('[data-testid="pending-tasks"]')
      );
      const inProgressCount = screen.getAllByText('1').find(el => 
        el.closest('[data-testid="in-progress-tasks"]')
      );
      const completedCount = screen.getAllByText('1').find(el => 
        el.closest('[data-testid="completed-tasks"]')
      );
      const overdueCount = screen.getAllByText('1').find(el => 
        el.closest('[data-testid="overdue-tasks"]')
      );

      expect(pendingCount).toBeInTheDocument();
      expect(inProgressCount).toBeInTheDocument();
      expect(completedCount).toBeInTheDocument();
      expect(overdueCount).toBeInTheDocument();
    });

    it('should handle empty task list', async () => {
      (tasksApi.getTasks as jest.Mock).mockResolvedValue([]);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Verify zero counts
      const zeroCounts = screen.getAllByText('0');
      expect(zeroCounts).toHaveLength(5); // Total, pending, in_progress, completed, overdue
    });
  });

  describe('Recent Tasks Section', () => {
    it('should display recent tasks', async () => {
      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/tarefas recentes/i)).toBeInTheDocument();
      });

      // Verify recent tasks are displayed
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    it('should display task priorities with correct styling', async () => {
      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Verify priority badges are displayed
      expect(screen.getByText(/alta/i)).toBeInTheDocument();
      expect(screen.getByText(/média/i)).toBeInTheDocument();
      expect(screen.getByText(/baixa/i)).toBeInTheDocument();
    });

    it('should display task status with correct styling', async () => {
      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Verify status badges are displayed
      expect(screen.getByText(/pendente/i)).toBeInTheDocument();
      expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
      expect(screen.getByText(/concluída/i)).toBeInTheDocument();
    });

    it('should limit recent tasks display', async () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTasks[0],
        id: i + 1,
        title: `Task ${i + 1}`,
      }));

      (tasksApi.getTasks as jest.Mock).mockResolvedValue(manyTasks);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/tarefas recentes/i)).toBeInTheDocument();
      });

      // Verify only first 5 tasks are shown
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 5')).toBeInTheDocument();
      expect(screen.queryByText('Task 6')).not.toBeInTheDocument();
    });

    it('should handle tasks without due dates', async () => {
      const tasksWithoutDates = [
        {
          ...mockTasks[0],
          due_date: null,
        },
      ];

      (tasksApi.getTasks as jest.Mock).mockResolvedValue(tasksWithoutDates);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Verify "Sem data" is displayed for tasks without due dates
      expect(screen.getByText('Sem data')).toBeInTheDocument();
    });
  });

  describe('Navigation and Actions', () => {
    it('should navigate to tasks page when "Ver todas" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/tarefas recentes/i)).toBeInTheDocument();
      });

      // Click "Ver todas" button
      const viewAllButton = screen.getByRole('button', { name: /ver todas/i });
      await user.click(viewAllButton);

      // Verify navigation to tasks page
      expect(mockPush).toHaveBeenCalledWith('/tasks');
    });

    it('should navigate to create task page when "Nova Tarefa" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Click "Nova Tarefa" button
      const newTaskButton = screen.getByRole('button', { name: /nova tarefa/i });
      await user.click(newTaskButton);

      // Verify navigation to create task page
      expect(mockPush).toHaveBeenCalledWith('/tasks/new');
    });

    it('should navigate to task details when task is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Click on a task
      const taskElement = screen.getByText('Task 1');
      await user.click(taskElement);

      // Verify navigation to task details
      expect(mockPush).toHaveBeenCalledWith('/tasks/1');
    });

    it('should navigate to profile when user name is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click on user name
      const userName = screen.getByText('John Doe');
      await user.click(userName);

      // Verify navigation to profile
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching data', async () => {
      // Mock delayed responses
      (authApi.getCurrentUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );
      (tasksApi.getTasks as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTasks), 100))
      );

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Verify loading spinner is shown
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Verify loading spinner is gone
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should show skeleton loading for task cards', async () => {
      // Mock delayed task response
      (tasksApi.getTasks as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTasks), 100))
      );

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for user to load but tasks still loading
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Verify skeleton loading for tasks
      expect(screen.getByTestId('tasks-skeleton')).toBeInTheDocument();

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Verify skeleton is gone
      expect(screen.queryByTestId('tasks-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle user loading error', async () => {
      (authApi.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Failed to load user'));

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

    it('should handle tasks loading error', async () => {
      (tasksApi.getTasks as jest.Mock).mockRejectedValue(new Error('Failed to load tasks'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Verify error message for tasks is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should handle partial data loading (user loads, tasks fail)', async () => {
      (tasksApi.getTasks as jest.Mock).mockRejectedValue(new Error('Failed to load tasks'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify statistics show zero (fallback)
      expect(screen.getAllByText('0')).toHaveLength(5);

      // Verify error message for tasks
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should dismiss error messages', async () => {
      const user = userEvent.setup();
      
      (tasksApi.getTasks as jest.Mock).mockRejectedValue(new Error('Failed to load tasks'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Dismiss error message
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      // Verify error message is gone
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Verify mobile-specific elements or layouts
      const dashboardContainer = screen.getByTestId('dashboard-container');
      expect(dashboardContainer).toHaveClass('mobile-layout');
    });

    it('should handle tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Verify tablet-specific elements or layouts
      const dashboardContainer = screen.getByTestId('dashboard-container');
      expect(dashboardContainer).toHaveClass('tablet-layout');
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Clear previous calls
      jest.clearAllMocks();

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /atualizar/i });
      await user.click(refreshButton);

      // Verify data is refetched
      expect(authApi.getCurrentUser).toHaveBeenCalled();
      expect(tasksApi.getTasks).toHaveBeenCalled();
    });

    it('should auto-refresh data periodically', async () => {
      jest.useFakeTimers();

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
      });

      // Clear previous calls
      jest.clearAllMocks();

      // Fast-forward time to trigger auto-refresh (e.g., 5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000);

      // Verify data is refetched
      await waitFor(() => {
        expect(tasksApi.getTasks).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });
});