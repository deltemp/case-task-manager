import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../entities/task.entity';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Implementar autenticação JWT',
    maxLength: 255,
  })
  @IsString({ message: 'O título deve ser uma string' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @MaxLength(255, { message: 'O título deve ter no máximo 255 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada da tarefa',
    example: 'Implementar sistema de autenticação usando JWT com Passport.js',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string;

  @ApiProperty({
    description: 'Status da tarefa',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
    default: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status deve ser um valor válido' })
  status?: TaskStatus = TaskStatus.PENDING;

  @ApiProperty({
    description: 'Prioridade da tarefa',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Prioridade deve ser um valor válido' })
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @ApiProperty({
    description: 'Data de vencimento da tarefa',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de vencimento deve ser uma data válida' })
  dueDate?: string;

  @ApiProperty({
    description: 'ID do usuário responsável pela tarefa',
    example: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'ID do responsável deve ser um número' })
  @Type(() => Number)
  assigneeId?: number;
}