import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { CreateTaskDto, UpdateTaskDto } from '../dtos';
import { TaskRepository } from '../repositories/task.repository';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<TaskRepository>;

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

  const mockAdmin: User = {
    id: 2,
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tasks: [],
  };

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2024-12-31'),
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTaskRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUser: jest.fn(),
    findOne: jest.fn(),
    findOneByUser: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TaskRepository,
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<TaskRepository>(TaskRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-12-31'),
    };

    it('should create a task successfully', async () => {
      const newTask = { ...mockTask, ...createTaskDto, user: mockUser };
      taskRepository.create.mockResolvedValue(newTask);

      const result = await service.create(createTaskDto, mockUser);

      expect(taskRepository.create).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual(newTask);
    });

    it('should create a task with default status PENDING', async () => {
      const newTask = { ...mockTask, ...createTaskDto, user: mockUser, status: TaskStatus.PENDING };
      taskRepository.create.mockResolvedValue(newTask);

      await service.create(createTaskDto, mockUser);

      expect(taskRepository.create).toHaveBeenCalledWith(createTaskDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for admin user', async () => {
      const tasks = [mockTask, { ...mockTask, id: 2 }];
      taskRepository.findAll.mockResolvedValue(tasks);

      const result = await service.findAll(mockAdmin);

      expect(taskRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(tasks);
    });

    it('should return only user tasks for regular user', async () => {
      const userTasks = [mockTask];
      taskRepository.findByUser.mockResolvedValue(userTasks);

      const result = await service.findAll(mockUser);

      expect(taskRepository.findByUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(userTasks);
    });
  });

  describe('findOne', () => {
    it('should return task for admin user', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(1, mockAdmin);

      expect(taskRepository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTask);
    });

    it('should return task for task owner', async () => {
      taskRepository.findOneByUser.mockResolvedValue(mockTask);

      const result = await service.findOne(1, mockUser);

      expect(taskRepository.findOneByUser).toHaveBeenCalledWith(1, mockUser.id);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOneByUser.mockResolvedValue(null);

      await expect(service.findOne(999, mockUser)).rejects.toThrow(NotFoundException);
      expect(taskRepository.findOneByUser).toHaveBeenCalledWith(999, mockUser.id);
    });


  });

  describe('update', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: TaskStatus.COMPLETED,
    };

    it('should update task successfully for task owner', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      taskRepository.findOneByUser.mockResolvedValue(mockTask);
      taskRepository.update.mockResolvedValue(updatedTask);

      const result = await service.update(1, updateTaskDto, mockUser);

      expect(taskRepository.update).toHaveBeenCalledWith(1, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should update task successfully for admin', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.update.mockResolvedValue(updatedTask);

      const result = await service.update(1, updateTaskDto, mockAdmin);

      expect(taskRepository.update).toHaveBeenCalledWith(1, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });



    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOneByUser.mockResolvedValue(null);

      await expect(service.update(999, updateTaskDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove task successfully for task owner', async () => {
      taskRepository.findOneByUser.mockResolvedValue(mockTask);
      taskRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(1, mockUser);

      expect(taskRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should remove task successfully for admin', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(1, mockAdmin);

      expect(taskRepository.softDelete).toHaveBeenCalledWith(1);
    });



    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOneByUser.mockResolvedValue(null);

      await expect(service.remove(999, mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});