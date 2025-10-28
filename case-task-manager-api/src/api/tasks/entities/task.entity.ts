import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ description: 'ID único da tarefa' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Título da tarefa' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Descrição detalhada da tarefa', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ 
    description: 'Status atual da tarefa',
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({ 
    description: 'Prioridade da tarefa',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ApiProperty({ description: 'Data de vencimento da tarefa', required: false })
  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @ApiProperty({ 
    description: 'ID do usuário responsável pela tarefa', 
    required: false,
    type: Number
  })
  @Column({ name: 'assignee_id', type: 'int', nullable: true })
  assigneeId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: 'Data de criação da tarefa' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ApiProperty({ 
    description: 'Usuário criador da tarefa',
    type: () => User
  })
  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ 
    description: 'Usuário designado para a tarefa',
    type: () => User,
    required: false
  })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;
}