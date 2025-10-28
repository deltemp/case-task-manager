import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.repository.create({
      ...createTaskDto,
      user,
    });
    return this.repository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      relations: ['user', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Task[]> {
    return this.repository.find({
      where: { 
        user: { id: userId },
        deletedAt: IsNull() 
      },
      relations: ['user', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Task | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user', 'assignee'],
    });
  }

  async findOneByUser(id: number, userId: number): Promise<Task | null> {
    return this.repository.findOne({
      where: { 
        id, 
        user: { id: userId },
        deletedAt: IsNull() 
      },
      relations: ['user', 'assignee'],
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    await this.repository.update(id, updateTaskDto);
    return this.findOne(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.update(id, { deletedAt: new Date() });
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}