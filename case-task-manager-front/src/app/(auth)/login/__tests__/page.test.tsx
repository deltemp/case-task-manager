import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { LoginData } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock components
jest.mock('@/components/forms/LoginForm', () => ({
  LoginForm: ({ onSubmit, isLoading }: { onSubmit: (data: LoginData) => void; isLoading: boolean }) => (
    <form
      data-testid="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email: 'test@example.com', password: 'password123' });
      }}
    >
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
    </form>
  ),
}));

jest.mock('@/components/ui/ErrorMessage', () => ({
  ErrorMessage: ({ message, onDismiss, variant }: { message: string; onDismiss: () => void; variant: string }) => (
    <div data-testid="error-message" data-variant={variant}>
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

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginPage', () => {
  const mockAuthReturn = {
    login: jest.fn(),
    loading: false,
    error: null,
    clearError: jest.fn(),
    user: null,
    isAuthenticated: false,
    register: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
  };

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUseAuth.mockReturnValue(mockAuthReturn);
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render login form and register link', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toHaveAttribute('href', '/register');
  });

  it('should display error message when there is an error', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      error: 'Invalid credentials',
    });

    render(<LoginPage />);

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Invalid credentials');
    expect(errorMessage).toHaveAttribute('data-variant', 'destructive');
  });

  it('should clear error when dismiss button is clicked', () => {
    const mockClearError = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      error: 'Some error',
      clearError: mockClearError,
    });

    render(<LoginPage />);

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should handle successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      login: mockLogin,
    });

    render(<LoginPage />);

    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Check success message appears
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('Login realizado com sucesso!')).toBeInTheDocument();
    });

    // Fast-forward timer to check redirect
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle login error', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Login failed'));
    const mockClearError = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      login: mockLogin,
      clearError: mockClearError,
    });

    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<LoginPage />);

    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockClearError).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should clear error and success message before login attempt', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    const mockClearError = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      login: mockLogin,
      clearError: mockClearError,
    });

    render(<LoginPage />);

    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('should pass loading state to LoginForm', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      loading: true,
    });

    render(<LoginPage />);

    const loginButton = screen.getByRole('button');
    expect(loginButton).toHaveTextContent('Loading...');
    expect(loginButton).toBeDisabled();
  });

  it('should dismiss success message when dismiss button is clicked', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      login: mockLogin,
    });

    render(<LoginPage />);

    // Trigger login to show success message
    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // Dismiss success message
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
  });

  it('should not display error or success messages when they are null', () => {
    render(<LoginPage />);

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
  });

  it('should have correct link styling and attributes', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: 'Cadastre-se' });
    expect(registerLink).toHaveClass('text-primary-500', 'hover:text-primary-600', 'font-medium', 'transition-colors', 'cursor-pointer');
  });
});