import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Task } from '../../tasks/entities/task.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID único do usuário' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nome do usuário' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Email único do usuário' })
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password: string;

  @ApiProperty({ 
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    default: UserRole.USER
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ 
    description: 'Telefone do usuário',
    required: false
  })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty({ 
    description: 'Localização do usuário',
    required: false
  })
  @Column({ nullable: true })
  location?: string;

  @ApiProperty({ 
    description: 'Biografia do usuário',
    required: false
  })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiProperty({ description: 'Data de criação do usuário' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ApiProperty({ 
    description: 'Tarefas associadas ao usuário',
    type: () => [Task]
  })
  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];
}