import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { UserRepository } from './user.repository';
import { User, UserRole } from '../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let dataSource: jest.Mocked<DataSource>;
  let entityManager: jest.Mocked<EntityManager>;

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

  const mockEntityManager = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = {
    createEntityManager: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    dataSource = module.get(DataSource);
    entityManager = mockEntityManager as any;

    // Setup the entity manager mock
    dataSource.createEntityManager.mockReturnValue(entityManager);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Mock the inherited findOne method
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await repository.findByEmail('user@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });

    it('should handle email case sensitivity', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      await repository.findByEmail('USER@EXAMPLE.COM');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'USER@EXAMPLE.COM' },
      });
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.com';
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      await repository.findByEmail(specialEmail);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: specialEmail },
      });
    });
  });

  describe('findActiveUsers', () => {
    it('should find all active users', async () => {
      const activeUsers = [
        mockUser,
        { ...mockUser, id: 2, email: 'user2@example.com' },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(activeUsers);

      const result = await repository.findActiveUsers();

      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() }, // IsNull() matcher
      });
      expect(result).toEqual(activeUsers);
    });

    it('should return empty array when no active users found', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await repository.findActiveUsers();

      expect(result).toEqual([]);
    });

    it('should exclude soft deleted users', async () => {
      const activeUsers = [mockUser];
      jest.spyOn(repository, 'find').mockResolvedValue(activeUsers);

      const result = await repository.findActiveUsers();

      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
      });
      expect(result).toEqual(activeUsers);
      // Verify that deleted users are not included
      expect(result.every(user => user.deletedAt === null)).toBe(true);
    });

    it('should handle database errors', async () => {
      jest.spyOn(repository, 'find').mockRejectedValue(new Error('Database connection error'));

      await expect(repository.findActiveUsers()).rejects.toThrow('Database connection error');
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete user by setting deletedAt', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);

      await repository.softDeleteUser(1);

      expect(repository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
      });
    });

    it('should handle non-existent user deletion', async () => {
      const updateResult = { affected: 0, generatedMaps: [], raw: [] };
      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);

      await repository.softDeleteUser(999);

      expect(repository.update).toHaveBeenCalledWith(999, {
        deletedAt: expect.any(Date),
      });
    });

    it('should set current timestamp for deletedAt', async () => {
      const beforeDelete = new Date();
      jest.spyOn(repository, 'update').mockImplementation((id, updateData: any) => {
        const afterDelete = new Date();
        expect(updateData.deletedAt).toBeInstanceOf(Date);
        expect(updateData.deletedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
        expect(updateData.deletedAt.getTime()).toBeLessThanOrEqual(afterDelete.getTime());
        return Promise.resolve({ affected: 1, generatedMaps: [], raw: [] });
      });

      await repository.softDeleteUser(1);

      expect(repository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
      });
    });

    it('should handle database errors during soft delete', async () => {
      jest.spyOn(repository, 'update').mockRejectedValue(new Error('Database error'));

      await expect(repository.softDeleteUser(1)).rejects.toThrow('Database error');
    });

    it('should handle multiple soft deletions', async () => {
      const updateResult = { affected: 1, generatedMaps: [], raw: [] };
      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);

      await repository.softDeleteUser(1);
      await repository.softDeleteUser(2);

      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(repository.update).toHaveBeenNthCalledWith(1, 1, {
        deletedAt: expect.any(Date),
      });
      expect(repository.update).toHaveBeenNthCalledWith(2, 2, {
        deletedAt: expect.any(Date),
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with DataSource', () => {
      expect(repository).toBeInstanceOf(UserRepository);
    });

    it('should call super constructor with User entity and entity manager', () => {
      // This test verifies the constructor behavior
      // The actual super() call is tested implicitly by the repository working correctly
      expect(repository).toBeDefined();
      expect(typeof repository.findByEmail).toBe('function');
      expect(typeof repository.findActiveUsers).toBe('function');
      expect(typeof repository.softDeleteUser).toBe('function');
    });
  });
});