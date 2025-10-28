import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';
import ProfilePage from '@/app/(authenticated)/profile/page';
import { authApi, usersApi } from '@/lib/api';
import { User } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  authApi: {
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  },
  usersApi: {
    updateProfile: jest.fn(),
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

describe('Profile Management Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Profile Display', () => {
    it('should display user profile information', async () => {
      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      });

      // Verify profile information is displayed correctly
      expect(screen.getByText(/perfil do usuário/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
      
      // Verify fields are initially disabled (view mode)
      expect(screen.getByLabelText(/nome/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
    });

    it('should handle loading state', async () => {
      // Mock delayed response
      (authApi.getCurrentUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Verify loading spinner is shown
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Verify loading spinner is gone
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should handle user without profile data', async () => {
      const userWithoutProfile = {
        ...mockUser,
        name: '',
        email: '',
      };

      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(userWithoutProfile);

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      // Verify empty fields are handled
      expect(screen.getByLabelText(/nome/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
    });
  });

  describe('Profile Editing', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Verify fields are now enabled
      expect(screen.getByLabelText(/nome/i)).toBeEnabled();
      expect(screen.getByLabelText(/email/i)).toBeEnabled();

      // Verify buttons changed
      expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    });

    it('should cancel edit mode and restore original values', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Modify fields
      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Name');
      await user.clear(emailInput);
      await user.type(emailInput, 'modified@example.com');

      // Cancel changes
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      // Verify original values are restored
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();

      // Verify fields are disabled again
      expect(screen.getByLabelText(/nome/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
    });

    it('should update profile successfully', async () => {
      const user = userEvent.setup();
      const updatedUser = {
        ...mockUser,
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      (usersApi.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Modify fields
      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');
      await user.clear(emailInput);
      await user.type(emailInput, 'jane@example.com');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify API was called with correct data
      await waitFor(() => {
        expect(usersApi.updateProfile).toHaveBeenCalledWith(1, {
          name: 'Jane Doe',
          email: 'jane@example.com',
        });
      });

      // Verify success message
      expect(screen.getByTestId('success-message')).toBeInTheDocument();

      // Verify fields are disabled again (exit edit mode)
      expect(screen.getByLabelText(/nome/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();

      // Verify updated values are displayed
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    });

    it('should handle profile update failure', async () => {
      const user = userEvent.setup();
      
      (usersApi.updateProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode and make changes
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      const nameInput = screen.getByLabelText(/nome/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Verify still in edit mode (fields enabled)
      expect(screen.getByLabelText(/nome/i)).toBeEnabled();
      expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      (usersApi.updateProfile as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode and make changes
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      const nameInput = screen.getByLabelText(/nome/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify loading state
      expect(screen.getByRole('button', { name: /salvando/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Clear required fields
      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.clear(nameInput);
      await user.clear(emailInput);

      // Try to save
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify validation errors
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();

      // Verify API was not called
      expect(usersApi.updateProfile).not.toHaveBeenCalled();

      // Verify still in edit mode
      expect(screen.getByLabelText(/nome/i)).toBeEnabled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Enter invalid email
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify validation error
      expect(screen.getByText(/email deve ter um formato válido/i)).toBeInTheDocument();

      // Verify API was not called
      expect(usersApi.updateProfile).not.toHaveBeenCalled();
    });

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Clear name field to trigger error
      const nameInput = screen.getByLabelText(/nome/i);
      await user.clear(nameInput);

      // Try to save to trigger validation
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verify error is shown
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();

      // Start typing to clear error
      await user.type(nameInput, 'J');

      // Verify error is cleared
      expect(screen.queryByText(/nome é obrigatório/i)).not.toBeInTheDocument();
    });
  });

  describe('Account Settings', () => {
    it('should display account settings section', async () => {
      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Verify account settings section is present
      expect(screen.getByText(/configurações da conta/i)).toBeInTheDocument();
      expect(screen.getByText(/alterar senha/i)).toBeInTheDocument();
      expect(screen.getByText(/notificações/i)).toBeInTheDocument();
      expect(screen.getByText(/excluir conta/i)).toBeInTheDocument();
    });

    it('should handle logout from profile page', async () => {
      const user = userEvent.setup();
      
      (authApi.logout as jest.Mock).mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /sair/i });
      await user.click(logoutButton);

      // Verify logout API was called
      expect(authApi.logout).toHaveBeenCalled();

      // Verify token was removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');

      // Verify redirect to login
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('Error Handling', () => {
    it('should handle profile loading failure', async () => {
      (authApi.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Failed to load profile'));

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should handle user without ID', async () => {
      const userWithoutId = {
        ...mockUser,
        id: undefined,
      };

      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(userWithoutId);

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/perfil do usuário/i)).toBeInTheDocument();
      });

      // Verify edit functionality is disabled
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    });

    it('should dismiss error messages', async () => {
      const user = userEvent.setup();
      
      (usersApi.updateProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      render(
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      );

      // Wait for profile to load and trigger an error
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Enter edit mode and try to save with error
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Wait for error message
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
});