import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRole } from '../entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUserResponse: UserResponseDto = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneForResponse: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should create a user successfully', async () => {
      const newUserResponse = { ...mockUserResponse, ...createUserDto };
      usersService.create.mockResolvedValue(newUserResponse);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(newUserResponse);
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.create.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle service errors', async () => {
      usersService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createUserDto)).rejects.toThrow('Database error');
    });

    it('should create admin user', async () => {
      const adminDto: CreateUserDto = {
        ...createUserDto,
        role: UserRole.ADMIN,
      };
      const adminResponse = { ...mockUserResponse, role: UserRole.ADMIN };
      usersService.create.mockResolvedValue(adminResponse);

      const result = await controller.create(adminDto);

      expect(usersService.create).toHaveBeenCalledWith(adminDto);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        mockUserResponse,
        { ...mockUserResponse, id: 2, email: 'user2@example.com' },
      ];
      usersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no users found', async () => {
      usersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      usersService.findAll.mockRejectedValue(new Error('Database connection error'));

      await expect(controller.findAll()).rejects.toThrow('Database connection error');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      usersService.findOneForResponse.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne(1);

      expect(usersService.findOneForResponse).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findOneForResponse.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(usersService.findOneForResponse).toHaveBeenCalledWith(999);
    });

    it('should handle invalid id parameter', async () => {
      // This would be handled by ParseIntPipe in real scenario
      usersService.findOneForResponse.mockRejectedValue(new Error('Invalid ID'));

      await expect(controller.findOne(NaN)).rejects.toThrow('Invalid ID');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should update a user successfully', async () => {
      const updatedUserResponse = { ...mockUserResponse, ...updateUserDto };
      usersService.update.mockResolvedValue(updatedUserResponse);

      const result = await controller.update(1, updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual(updatedUserResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.update.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(usersService.update).toHaveBeenCalledWith(999, updateUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.update.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.update(1, updateUserDto)).rejects.toThrow(ConflictException);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateUserDto = { name: 'New Name Only' };
      const updatedResponse = { ...mockUserResponse, name: 'New Name Only' };
      usersService.update.mockResolvedValue(updatedResponse);

      const result = await controller.update(1, partialUpdate);

      expect(usersService.update).toHaveBeenCalledWith(1, partialUpdate);
      expect(result.name).toBe('New Name Only');
    });

    it('should handle password updates', async () => {
      const passwordUpdate: UpdateUserDto = { password: 'newPassword123' };
      usersService.update.mockResolvedValue(mockUserResponse);

      await controller.update(1, passwordUpdate);

      expect(usersService.update).toHaveBeenCalledWith(1, passwordUpdate);
    });

    it('should handle role updates', async () => {
      const roleUpdate: UpdateUserDto = { role: UserRole.ADMIN };
      const adminResponse = { ...mockUserResponse, role: UserRole.ADMIN };
      usersService.update.mockResolvedValue(adminResponse);

      const result = await controller.update(1, roleUpdate);

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      usersService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(usersService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.remove.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(usersService.remove).toHaveBeenCalledWith(999);
    });

    it('should handle service errors during deletion', async () => {
      usersService.remove.mockRejectedValue(new Error('Cannot delete user with active tasks'));

      await expect(controller.remove(1)).rejects.toThrow('Cannot delete user with active tasks');
    });

    it('should handle multiple deletion attempts', async () => {
      usersService.remove.mockResolvedValue(undefined);

      await controller.remove(1);
      await controller.remove(2);

      expect(usersService.remove).toHaveBeenCalledTimes(2);
      expect(usersService.remove).toHaveBeenNthCalledWith(1, 1);
      expect(usersService.remove).toHaveBeenNthCalledWith(2, 2);
    });
  });
});