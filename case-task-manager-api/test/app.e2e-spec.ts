import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/api/users/entities/user.entity';
import { Task } from '../src/api/tasks/entities/task.entity';
import { UserRole } from '../src/api/users/enums/user-role.enum';
import { TaskStatus } from '../src/api/tasks/enums/task-status.enum';
import { TaskPriority } from '../src/api/tasks/enums/task-priority.enum';
import * as bcrypt from 'bcrypt';

describe('Case Task Manager API (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let taskRepository: Repository<Task>;
  let adminToken: string;
  let userToken: string;
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    taskRepository = moduleFixture.get<Repository<Task>>(getRepositoryToken(Task));

    // Clean up database
    await taskRepository.delete({});
    await userRepository.delete({});

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    adminUser = await userRepository.save({
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });

    regularUser = await userRepository.save({
      email: 'user@test.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
    });

    // Get tokens for both users
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLoginResponse.body.access_token;

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    userToken = userLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await taskRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('Root endpoint', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication Workflow', () => {
    it('should register a new user', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.firstName).toBe(newUser.firstName);
      expect(response.body.lastName).toBe(newUser.lastName);
      expect(response.body.role).toBe(UserRole.USER);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      const duplicateUser = {
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateUser)
        .expect(409);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should not login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should get current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.email).toBe('admin@test.com');
      expect(response.body.role).toBe(UserRole.ADMIN);
    });

    it('should not get current user without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Task Management Workflow', () => {
    let createdTaskId: string;

    it('should create a task as admin', async () => {
      const newTask = {
        title: 'Test Task',
        description: 'This is a test task',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTask)
        .expect(201);

      createdTaskId = response.body.id;
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.status).toBe(newTask.status);
      expect(response.body.priority).toBe(newTask.priority);
      expect(response.body.createdBy.id).toBe(adminUser.id);
    });

    it('should create a task as regular user', async () => {
      const newTask = {
        title: 'User Task',
        description: 'This is a user task',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newTask)
        .expect(201);

      expect(response.body.title).toBe(newTask.title);
      expect(response.body.createdBy.id).toBe(regularUser.id);
    });

    it('should not create task without authentication', async () => {
      const newTask = {
        title: 'Unauthorized Task',
        description: 'This should fail',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .send(newTask)
        .expect(401);
    });

    it('should get all tasks as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get only own tasks as regular user', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((task: any) => {
        expect(task.createdBy.id).toBe(regularUser.id);
      });
    });

    it('should get specific task by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdTaskId);
      expect(response.body.title).toBe('Test Task');
    });

    it('should update task as admin', async () => {
      const updateData = {
        title: 'Updated Test Task',
        status: TaskStatus.IN_PROGRESS,
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should not update task without proper authorization', async () => {
      const updateData = {
        title: 'Unauthorized Update',
      };

      await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should delete task as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('User Management Workflow (Admin Only)', () => {
    let createdUserId: string;

    it('should create a user as admin', async () => {
      const newUser = {
        email: 'created@test.com',
        password: 'password123',
        firstName: 'Created',
        lastName: 'User',
        role: UserRole.USER,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      createdUserId = response.body.id;
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.firstName).toBe(newUser.firstName);
      expect(response.body.role).toBe(newUser.role);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not create user as regular user', async () => {
      const newUser = {
        email: 'unauthorized@test.com',
        password: 'password123',
        firstName: 'Unauthorized',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser)
        .expect(403);
    });

    it('should get all users as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should not get users as regular user', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should get specific user by id as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdUserId);
      expect(response.body.email).toBe('created@test.com');
    });

    it('should update user as admin', async () => {
      const updateData = {
        firstName: 'Updated',
        role: UserRole.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.role).toBe(updateData.role);
    });

    it('should delete user as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is soft deleted
      await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent task', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      await request(app.getHttpServer())
        .get(`/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should validate request body for task creation', async () => {
      const invalidTask = {
        title: '', // Empty title should fail validation
        description: 'Valid description',
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidTask)
        .expect(400);
    });

    it('should validate request body for user creation', async () => {
      const invalidUser = {
        email: 'invalid-email', // Invalid email format
        password: '123', // Too short password
        firstName: '',
        lastName: '',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser)
        .expect(400);
    });
  });
});
