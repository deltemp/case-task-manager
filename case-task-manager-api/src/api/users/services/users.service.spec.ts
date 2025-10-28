import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { UsersService } from './users.service';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { User, UserRole } from '../entities/user.entity';
import { USER_REPOSITORY } from '../constants';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    role: UserRole.USER,
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tasks: [],
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    findActiveUsers: jest.fn(),
    update: jest.fn(),
    softDeleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(USER_REPOSITORY);

    // Reset all mocks
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should create a user successfully', async () => {
      const newUser = { ...mockUser, ...createUserDto, password: 'hashedPassword' };
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const result = await service.create(createUserDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    });
  });

  describe('findAll', () => {
    it('should return all active users', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'user2@example.com' }];
      userRepository.findActiveUsers.mockResolvedValue(users);

      const result = await service.findAll();

      expect(userRepository.findActiveUsers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
    });

    it('should return empty array when no users found', async () => {
      userRepository.findActiveUsers.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findOneForResponse', () => {
    it('should return UserResponseDto when user found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneForResponse(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForResponse(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@example.com');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      userRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call for existence check
        .mockResolvedValueOnce(updatedUser); // Second call after update
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(1, updateUserDto);

      expect(userRepository.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const otherUser = { ...mockUser, id: 2, email: 'updated@example.com' };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(otherUser);

      await expect(service.update(1, updateUserDto)).rejects.toThrow(ConflictException);
    });

    it('should hash password when updating password', async () => {
      const updateWithPassword: UpdateUserDto = {
        password: 'newPassword123',
      };
      const updatedUser = { ...mockUser, password: 'hashedNewPassword' };
      
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockedBcrypt.hash.mockResolvedValue('hashedNewPassword' as never);

      await service.update(1, updateWithPassword);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(userRepository.update).toHaveBeenCalledWith(1, {
        password: 'hashedNewPassword',
      });
    });

    it('should allow updating to same email', async () => {
      const updateSameEmail: UpdateUserDto = {
        email: mockUser.email,
        name: 'Updated Name',
      };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(1, updateSameEmail);

      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.update(1, updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.softDeleteUser.mockResolvedValue(undefined);

      await service.remove(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: IsNull() },
      });
      expect(userRepository.softDeleteUser).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(userRepository.softDeleteUser).not.toHaveBeenCalled();
    });
  });
});