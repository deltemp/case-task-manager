import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { AuthService } from '../services/auth.service';
import { User, UserRole } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

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

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const mockPayload: JwtPayload = {
      sub: 1,
      email: 'test@example.com',
      role: UserRole.USER,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };

    it('should return user when token payload is valid', async () => {
      // Arrange
      authService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(mockPayload);

      // Assert
      expect(authService.validateUser).toHaveBeenCalledWith(mockPayload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      authService.validateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Token inválido'),
      );
      expect(authService.validateUser).toHaveBeenCalledWith(mockPayload.sub);
    });

    it('should handle different user roles', async () => {
      // Arrange
      const adminUser: User = { ...mockUser, id: 2, role: UserRole.ADMIN };
      const adminPayload: JwtPayload = { ...mockPayload, sub: 2, role: UserRole.ADMIN };
      authService.validateUser.mockResolvedValue(adminUser);

      // Act
      const result = await strategy.validate(adminPayload);

      // Assert
      expect(authService.validateUser).toHaveBeenCalledWith(adminPayload.sub);
      expect(result).toEqual(adminUser);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should handle payload with missing optional fields', async () => {
      // Arrange
      const minimalPayload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      };
      authService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(minimalPayload);

      // Assert
      expect(authService.validateUser).toHaveBeenCalledWith(minimalPayload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should handle authService error', async () => {
      // Arrange
      const serviceError = new Error('Database connection error');
      authService.validateUser.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(strategy.validate(mockPayload)).rejects.toThrow(serviceError);
      expect(authService.validateUser).toHaveBeenCalledWith(mockPayload.sub);
    });

    it('should validate payload with different user IDs', async () => {
      // Arrange
      const differentPayload: JwtPayload = {
        ...mockPayload,
        sub: 999,
      };
      const differentUser: User = { ...mockUser, id: 999 };
      authService.validateUser.mockResolvedValue(differentUser);

      // Act
      const result = await strategy.validate(differentPayload);

      // Assert
      expect(authService.validateUser).toHaveBeenCalledWith(999);
      expect(result).toEqual(differentUser);
    });
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from config service', () => {
      // Arrange
      configService.get.mockReturnValue('test-secret-key');

      // Act
      const newStrategy = new JwtStrategy(configService, authService);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use default secret when JWT_SECRET is not provided', () => {
      // Arrange
      configService.get.mockReturnValue(null);

      // Act
      const newStrategy = new JwtStrategy(configService, authService);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});