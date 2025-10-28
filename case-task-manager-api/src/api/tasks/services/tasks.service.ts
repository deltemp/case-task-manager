import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { Task } from '../entities/task.entity';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.taskRepository.create(createTaskDto, user);
  }

  async findAll(user: User): Promise<Task[]> {
    if (user.role === UserRole.ADMIN) {
      return this.taskRepository.findAll();
    }
    
    return this.taskRepository.findByUser(user.id);
  }

  async findOne(id: number, user: User): Promise<Task> {
    let task: Task | null;

    if (user.role === UserRole.ADMIN) {
      task = await this.taskRepository.findOne(id);
    } else {
      task = await this.taskRepository.findOneByUser(id, user.id);
    }

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    if (user.role !== UserRole.ADMIN && task.user.id !== user.id) {
      throw new ForbiddenException('Você não tem permissão para atualizar esta tarefa');
    }

    const updatedTask = await this.taskRepository.update(id, updateTaskDto);
    
    if (!updatedTask) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return updatedTask;
  }

  async remove(id: number, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    if (user.role !== UserRole.ADMIN && task.user.id !== user.id) {
      throw new ForbiddenException('Você não tem permissão para deletar esta tarefa');
    }

    await this.taskRepository.softDelete(id);
  }
}