import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto, UpdateTaskDto } from '../dtos';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { User, UserRole } from '../../users/entities/user.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: jest.Mocked<TasksService>;

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

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get(TasksService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-12-31'),
    };

    it('should create a task successfully', async () => {
      const newTask = { ...mockTask, ...createTaskDto };
      tasksService.create.mockResolvedValue(newTask);

      const result = await controller.create(createTaskDto, mockUser);

      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual(newTask);
    });

    it('should handle service errors', async () => {
      tasksService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createTaskDto, mockUser)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all tasks for admin', async () => {
      const tasks = [mockTask, { ...mockTask, id: 2 }];
      tasksService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll(mockAdmin);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockAdmin);
      expect(result).toEqual(tasks);
    });

    it('should return user tasks for regular user', async () => {
      const userTasks = [mockTask];
      tasksService.findAll.mockResolvedValue(userTasks);

      const result = await controller.findAll(mockUser);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(userTasks);
    });

    it('should return empty array when no tasks found', async () => {
      tasksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      tasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(1, mockUser);

      expect(tasksService.findOne).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      tasksService.findOne.mockRejectedValue(new NotFoundException('Tarefa não encontrada'));

      await expect(controller.findOne(999, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      tasksService.findOne.mockRejectedValue(new ForbiddenException('Você não tem permissão para acessar esta tarefa'));

      await expect(controller.findOne(1, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: TaskStatus.COMPLETED,
    };

    it('should update a task successfully', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      tasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(1, updateTaskDto, mockUser);

      expect(tasksService.update).toHaveBeenCalledWith(1, updateTaskDto, mockUser);
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      tasksService.update.mockRejectedValue(new NotFoundException('Tarefa não encontrada'));

      await expect(controller.update(999, updateTaskDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      tasksService.update.mockRejectedValue(new ForbiddenException('Você não tem permissão para atualizar esta tarefa'));

      await expect(controller.update(1, updateTaskDto, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateTaskDto = { status: TaskStatus.IN_PROGRESS };
      const updatedTask = { ...mockTask, status: TaskStatus.IN_PROGRESS };
      tasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(1, partialUpdate, mockUser);

      expect(tasksService.update).toHaveBeenCalledWith(1, partialUpdate, mockUser);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should remove a task successfully', async () => {
      tasksService.remove.mockResolvedValue(undefined);

      await controller.remove(1, mockUser);

      expect(tasksService.remove).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when task not found', async () => {
      tasksService.remove.mockRejectedValue(new NotFoundException('Tarefa não encontrada'));

      await expect(controller.remove(999, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      tasksService.remove.mockRejectedValue(new ForbiddenException('Você não tem permissão para deletar esta tarefa'));

      await expect(controller.remove(1, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should handle admin deletion of any task', async () => {
      tasksService.remove.mockResolvedValue(undefined);

      await controller.remove(1, mockAdmin);

      expect(tasksService.remove).toHaveBeenCalledWith(1, mockAdmin);
    });
  });
});