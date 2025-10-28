import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { UsersService } from '../services/users.service';
import { UserRepository } from '../repositories/user.repository';
import { USER_REPOSITORY } from '../constants';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    tasks: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      findByEmail: jest.fn(),
      findActiveUsers: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDeleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(USER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should create a user successfully', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(repository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all active users', async () => {
      repository.findActiveUsers.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(repository.findActiveUsers).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(mockUser.email);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: IsNull() },
      });
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(1);
      
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      repository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      repository.findByEmail.mockResolvedValue(null);

      const result = await service.update(1, updateUserDto);

      expect(repository.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result.email).toBe('updated@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(1, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await service.remove(1);

      expect(repository.softDeleteUser).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});