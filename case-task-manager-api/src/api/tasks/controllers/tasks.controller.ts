import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto, UpdateTaskDto } from '../dtos';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Task } from '../entities/task.entity';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'Tarefa criada com sucesso',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar tarefas',
    description: 'Usuários comuns veem apenas suas tarefas. Admins veem todas as tarefas.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas retornada com sucesso',
    type: [Task],
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async findAll(@CurrentUser() user: User): Promise<Task[]> {
    return this.tasksService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa por ID' })
  @ApiParam({ name: 'id', description: 'ID da tarefa', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa encontrada',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarefa não encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  @ApiParam({ name: 'id', description: 'ID da tarefa', type: 'number' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({
    status: 200,
    description: 'Tarefa atualizada com sucesso',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarefa não encontrada',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar tarefa (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID da tarefa', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa deletada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarefa não encontrada',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.tasksService.remove(id, user);
  }
}