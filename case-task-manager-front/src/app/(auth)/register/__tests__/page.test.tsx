import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { RegisterData } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock components
jest.mock('@/components/forms/RegisterForm', () => ({
  RegisterForm: ({ onSubmit, isLoading }: { onSubmit: (data: RegisterData) => void; isLoading: boolean }) => (
    <form
      data-testid="register-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      }}
    >
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Register'}
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

describe('RegisterPage', () => {
  const mockAuthReturn = {
    register: jest.fn(),
    loading: false,
    error: null,
    clearError: jest.fn(),
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
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

  it('should render register form and login link', () => {
    render(<RegisterPage />);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByText('Já tem uma conta?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Faça login' })).toHaveAttribute('href', '/login');
  });

  it('should display error message when there is an error', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      error: 'Email already exists',
    });

    render(<RegisterPage />);

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Email already exists');
    expect(errorMessage).toHaveAttribute('data-variant', 'destructive');
  });

  it('should clear error when dismiss button is clicked', () => {
    const mockClearError = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      error: 'Some error',
      clearError: mockClearError,
    });

    render(<RegisterPage />);

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should handle successful registration', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      register: mockRegister,
    });

    render(<RegisterPage />);

    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Check success message appears
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('Conta criada com sucesso! Redirecionando para o login...')).toBeInTheDocument();
    });

    // Fast-forward timer to check redirect
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle registration error', async () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('Registration failed'));
    const mockClearError = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      register: mockRegister,
      clearError: mockClearError,
    });

    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<RegisterPage />);

    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      expect(mockClearError).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Register error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should clear error and success message before registration attempt', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    const mockClearError = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      register: mockRegister,
      clearError: mockClearError,
    });

    render(<RegisterPage />);

    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('should pass loading state to RegisterForm', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      loading: true,
    });

    render(<RegisterPage />);

    const registerButton = screen.getByRole('button');
    expect(registerButton).toHaveTextContent('Loading...');
    expect(registerButton).toBeDisabled();
  });

  it('should dismiss success message when dismiss button is clicked', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      register: mockRegister,
    });

    render(<RegisterPage />);

    // Trigger registration to show success message
    const form = screen.getByTestId('register-form');
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
    render(<RegisterPage />);

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
  });

  it('should have correct link styling and attributes', () => {
    render(<RegisterPage />);

    const loginLink = screen.getByRole('link', { name: 'Faça login' });
    expect(loginLink).toHaveClass('text-primary-500', 'hover:text-primary-600', 'font-medium', 'transition-colors', 'cursor-pointer');
  });

  it('should redirect to login after 2 seconds on successful registration', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...mockAuthReturn,
      register: mockRegister,
    });

    render(<RegisterPage />);

    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // Advance timer by less than 2 seconds - should not redirect yet
    jest.advanceTimersByTime(1000);
    expect(mockPush).not.toHaveBeenCalled();

    // Advance timer to complete 2 seconds - should redirect now
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});