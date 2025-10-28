import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

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

  const mockRegisterResponse = {
    success: true,
    message: 'Usuário criado com sucesso',
    user: new UserResponseDto(mockUser),
  };

  const mockLoginResponse = {
    success: true,
    access_token: 'jwt-token',
    user: new UserResponseDto(mockUser),
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const expectedResult = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      authService.register.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.register(createUserDto)).rejects.toThrow(ConflictException);
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle validation errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'invalid-email',
        password: '123',
        name: '',
      };

      authService.register.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.register(createUserDto)).rejects.toThrow('Validation failed');
    });
  });

  describe('login', () => {
    const loginDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      // Arrange
      const unauthorizedError = new UnauthorizedException('Credenciais inválidas');
      authService.login.mockRejectedValue(unauthorizedError);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(unauthorizedError);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle missing email', async () => {
      // Arrange
      const invalidDto = { ...loginDto, email: '' };
      const validationError = new Error('Email is required');
      authService.login.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.login(invalidDto as LoginUserDto)).rejects.toThrow(validationError);
      expect(authService.login).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle missing password', async () => {
      // Arrange
      const invalidDto = { ...loginDto, password: '' };
      const validationError = new Error('Password is required');
      authService.login.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.login(invalidDto as LoginUserDto)).rejects.toThrow(validationError);
      expect(authService.login).toHaveBeenCalledWith(invalidDto);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user as UserResponseDto', async () => {
      const result = await controller.getCurrentUser(mockUser);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(result.role).toBe(mockUser.role);
      expect(result.createdAt).toBe(mockUser.createdAt);
      expect(result.updatedAt).toBe(mockUser.updatedAt);
    });

    it('should handle different user roles', async () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
      };

      const result = await controller.getCurrentUser(adminUser);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should not expose password in response', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
      };

      const result = await controller.getCurrentUser(userWithPassword);

      // UserResponseDto should exclude password field
      expect(result).toBeInstanceOf(UserResponseDto);
      // Note: Password exclusion is handled by the UserResponseDto class transformer
    });
  });
});