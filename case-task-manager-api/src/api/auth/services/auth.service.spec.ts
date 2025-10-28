import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

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
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should successfully register a new user', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      usersService.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(createUserDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(result).toEqual({
        success: true,
        message: 'Usuário criado com sucesso',
        user: expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        }),
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(createUserDto)).rejects.toThrow(
        new ConflictException('Usuário com este email já existe'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hash error', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockRejectedValue(new Error('Hash error') as never);

      // Act & Assert
      await expect(service.register(createUserDto)).rejects.toThrow('Hash error');
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.login(loginUserDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginUserDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        success: true,
        access_token: 'jwt-token',
        user: expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        }),
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginUserDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginUserDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginUserDto.password, mockUser.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt compare error', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockRejectedValue(new Error('Compare error') as never);

      // Act & Assert
      await expect(service.login(loginUserDto)).rejects.toThrow('Compare error');
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 1;
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(userId);

      // Assert
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 999;
      usersService.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(userId);

      // Assert
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should handle service error', async () => {
      // Arrange
      const userId = 1;
      usersService.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.validateUser(userId)).rejects.toThrow('Database error');
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });
  });
});