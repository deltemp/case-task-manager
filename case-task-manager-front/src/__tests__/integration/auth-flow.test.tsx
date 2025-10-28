import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';
import LoginPage from '@/app/(auth)/login/page';
import RegisterPage from '@/app/(auth)/register/page';
import DashboardPage from '@/app/(authenticated)/dashboard/page';
import { authApi } from '@/lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
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

// Mock components that are not essential for integration tests
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

jest.mock('@/components/modals/TaskModal', () => {
  return function MockTaskModal() {
    return <div data-testid="task-modal">Task Modal</div>;
  };
});

jest.mock('@/components/modals/DeleteConfirmModal', () => {
  return function MockDeleteConfirmModal() {
    return <div data-testid="delete-confirm-modal">Delete Confirm Modal</div>;
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete successful login flow', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };

      (authApi.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
      });

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      // Verify API was called with correct data
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        });
      });

      // Verify token was stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');

      // Verify redirect to dashboard
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle login failure', async () => {
      const user = userEvent.setup();
      
      (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Verify no token was stored
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Verify no redirect occurred
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should validate form fields before submission', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: /entrar/i });
      await user.click(loginButton);

      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
      });

      // Verify API was not called
      expect(authApi.login).not.toHaveBeenCalled();
    });
  });

  describe('Registration Flow', () => {
    it('should complete successful registration flow', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
      };

      (authApi.register as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
      });

      render(
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      );

      // Fill in registration form
      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      const registerButton = screen.getByRole('button', { name: /cadastrar/i });

      await user.type(nameInput, 'Jane Doe');
      await user.type(emailInput, 'jane@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(registerButton);

      // Verify API was called with correct data
      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        });
      });

      // Verify success message is displayed
      expect(screen.getByTestId('success-message')).toBeInTheDocument();

      // Verify redirect to login after delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
    });

    it('should handle registration failure', async () => {
      const user = userEvent.setup();
      
      (authApi.register as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      render(
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      );

      // Fill in registration form
      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      const registerButton = screen.getByRole('button', { name: /cadastrar/i });

      await user.type(nameInput, 'Jane Doe');
      await user.type(emailInput, 'jane@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(registerButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Verify no redirect occurred
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      );

      // Fill in registration form with mismatched passwords
      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      const registerButton = screen.getByRole('button', { name: /cadastrar/i });

      await user.type(nameInput, 'Jane Doe');
      await user.type(emailInput, 'jane@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(registerButton);

      // Verify validation error is shown
      await waitFor(() => {
        expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
      });

      // Verify API was not called
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should complete successful logout flow', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated state
      mockLocalStorage.getItem.mockReturnValue('mock-token');
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/bem-vindo, john doe/i)).toBeInTheDocument();
      });

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /sair/i });
      await user.click(logoutButton);

      // Verify token was removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');

      // Verify redirect to login
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication state across page reloads', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };

      // Mock existing token
      mockLocalStorage.getItem.mockReturnValue('existing-token');
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Verify user data is loaded from token
      await waitFor(() => {
        expect(authApi.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByText(/bem-vindo, john doe/i)).toBeInTheDocument();
      });
    });

    it('should handle expired token gracefully', async () => {
      // Mock expired token
      mockLocalStorage.getItem.mockReturnValue('expired-token');
      (authApi.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Token expired'));

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      // Verify token is removed and user is redirected
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Navigation Between Auth Pages', () => {
    it('should navigate from login to register page', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Find and click register link
      const registerLink = screen.getByRole('link', { name: /criar conta/i });
      await user.click(registerLink);

      // Verify navigation occurred (in real app, this would be handled by Next.js routing)
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should navigate from register to login page', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      );

      // Find and click login link
      const loginLink = screen.getByRole('link', { name: /fazer login/i });
      await user.click(loginLink);

      // Verify navigation occurred (in real app, this would be handled by Next.js routing)
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });
});