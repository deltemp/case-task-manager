import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'ID único do usuário' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Nome do usuário' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Email único do usuário' })
  @Expose()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty({ 
    description: 'Papel do usuário no sistema',
    enum: UserRole
  })
  @Expose()
  role: UserRole;

  @ApiProperty({ 
    description: 'Telefone do usuário',
    required: false
  })
  @Expose()
  phone?: string;

  @ApiProperty({ 
    description: 'Localização do usuário',
    required: false
  })
  @Expose()
  location?: string;

  @ApiProperty({ 
    description: 'Biografia do usuário',
    required: false
  })
  @Expose()
  bio?: string;

  @ApiProperty({ description: 'Data de criação do usuário' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}