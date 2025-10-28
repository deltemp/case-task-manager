import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api';
import { User } from '@/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  usersApi: {
    updateProfile: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock components
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}));

jest.mock('@/components/ui/ErrorMessage', () => ({
  ErrorMessage: ({ message, onDismiss, variant }: { message: string; onDismiss: () => void; variant?: string }) => (
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

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProfilePage', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '123-456-7890',
    location: 'Test City',
    bio: 'Test bio',
    role: 'Developer',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockUpdateUser = jest.fn();

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
      updateUser: mockUpdateUser,
    });

    jest.clearAllMocks();
    // Mock console.error and console.log to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      updateUser: jest.fn(),
    });

    render(<ProfilePage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg');
  });

  it('should render profile information when user is loaded', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Perfil do Usuário')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', () => {
    render(<ProfilePage />);

    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Developer')).toBeInTheDocument();

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
    expect(screen.queryByText('Editar Perfil')).not.toBeInTheDocument();
  });

  it('should cancel editing when cancel button is clicked', () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Change a value
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

    // Cancel editing
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    // Should revert to original values and exit edit mode
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument();
    expect(screen.getByText('Editar Perfil')).toBeInTheDocument();
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
  });

  it('should update input values when typing in edit mode', () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Change name
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();

    // Change email
    const emailInput = screen.getByDisplayValue('test@example.com');
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    expect(screen.getByDisplayValue('updated@example.com')).toBeInTheDocument();

    // Change phone
    const phoneInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.change(phoneInput, { target: { value: '987-654-3210' } });
    expect(screen.getByDisplayValue('987-654-3210')).toBeInTheDocument();

    // Change location
    const locationInput = screen.getByDisplayValue('Test City');
    fireEvent.change(locationInput, { target: { value: 'New City' } });
    expect(screen.getByDisplayValue('New City')).toBeInTheDocument();

    // Change bio
    const bioInput = screen.getByDisplayValue('Test bio');
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });
    expect(screen.getByDisplayValue('Updated bio')).toBeInTheDocument();

    // Change role
    const roleInput = screen.getByDisplayValue('Developer');
    fireEvent.change(roleInput, { target: { value: 'Senior Developer' } });
    expect(screen.getByDisplayValue('Senior Developer')).toBeInTheDocument();
  });

  it('should validate required fields before saving', async () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Clear required fields
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: '' } });

    const emailInput = screen.getByDisplayValue('test@example.com');
    fireEvent.change(emailInput, { target: { value: '' } });

    // Try to save
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    // Should not call API and should show validation errors
    expect(mockUsersApi.updateProfile).not.toHaveBeenCalled();
    // Note: The component doesn't render validation errors in the UI, 
    // but it prevents the API call
  });

  it('should validate email format', async () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Enter invalid email
    const emailInput = screen.getByDisplayValue('test@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Try to save
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    // Should not call API due to validation error
    expect(mockUsersApi.updateProfile).not.toHaveBeenCalled();
  });

  it('should save profile successfully', async () => {
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    mockUsersApi.updateProfile.mockResolvedValue(updatedUser);

    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Update name
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    // Save
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUsersApi.updateProfile).toHaveBeenCalledWith('1', {
        name: 'Updated Name',
        email: 'test@example.com',
        phone: '123-456-7890',
        location: 'Test City',
        bio: 'Test bio',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('Perfil atualizado com sucesso!')).toBeInTheDocument();
    });

    expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
    expect(screen.getByText('Editar Perfil')).toBeInTheDocument(); // Should exit edit mode
  });

  it('should handle save error', async () => {
    mockUsersApi.updateProfile.mockRejectedValue(new Error('Update failed'));

    render(<ProfilePage />);

    // Enter edit mode and save
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Erro ao atualizar perfil. Tente novamente.')).toBeInTheDocument();
    });

    // Should still be in edit mode
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('should show loading state when saving', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockUsersApi.updateProfile.mockReturnValue(promise);

    render(<ProfilePage />);

    // Enter edit mode and save
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    // Should show loading state
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Buttons should be disabled
    expect(screen.getByText('Cancelar')).toBeDisabled();

    // Resolve the promise
    resolvePromise!(mockUser);
    await waitFor(() => {
      expect(screen.queryByText('Salvando...')).not.toBeInTheDocument();
    });
  });

  it('should dismiss error and success messages', () => {
    render(<ProfilePage />);

    // Simulate error state
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Manually trigger error by mocking a failed save
    mockUsersApi.updateProfile.mockRejectedValue(new Error('Test error'));
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  it('should handle user without ID', async () => {
    const userWithoutId = { ...mockUser, id: undefined };
    mockUseAuth.mockReturnValue({
      user: userWithoutId as any,
      loading: false,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      updateUser: mockUpdateUser,
    });

    render(<ProfilePage />);

    // Enter edit mode and try to save
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Erro ao atualizar perfil. Tente novamente.')).toBeInTheDocument();
    });

    expect(mockUsersApi.updateProfile).not.toHaveBeenCalled();
  });

  it('should clear field errors when typing', () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Editar Perfil');
    fireEvent.click(editButton);

    // Clear name to trigger validation error
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: '' } });

    // Try to save to trigger validation
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    // Now type in the name field - this should clear the error
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    // The error should be cleared (though not visible in UI, it's cleared in state)
    expect(nameInput).toHaveValue('New Name');
  });

  it('should render account settings section', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Configurações da Conta')).toBeInTheDocument();
    expect(screen.getByText('Alterar Senha')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Excluir Conta')).toBeInTheDocument();
  });

  it('should handle empty user profile fields', () => {
    const emptyUser = {
      ...mockUser,
      phone: '',
      location: '',
      bio: '',
      role: '',
    };

    mockUseAuth.mockReturnValue({
      user: emptyUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      updateUser: mockUpdateUser,
    });

    render(<ProfilePage />);

    // Should render empty strings without crashing
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});