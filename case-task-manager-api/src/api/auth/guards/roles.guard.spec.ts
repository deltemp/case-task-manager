import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { User, UserRole } from '../../users/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tasks: [],
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: 2,
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: User): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue(null);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [context.getHandler(), context.getClass()],
      );
    });

    it('should return true when user has required role', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [context.getHandler(), context.getClass()],
      );
    });

    it('should return true when admin user accesses user-only endpoint', () => {
      // Arrange
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false); // Admin doesn't have USER role specifically
    });

    it('should return true when admin user accesses admin endpoint', () => {
      // Arrange
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when admin has one of multiple required roles', () => {
      // Arrange
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user has none of the required roles', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle empty required roles array', () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue([]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false); // Empty array should deny access
    });

    it('should handle undefined user', () => {
      // Arrange
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow();
    });
  });
});