import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email válido do usuário',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole, { message: 'Role deve ser user ou admin' })
  @IsOptional()
  role?: UserRole = UserRole.USER;

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Localização do usuário',
    example: 'São Paulo, SP',
    required: false,
  })
  @IsString({ message: 'Localização deve ser uma string' })
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor Full Stack com experiência em React e Node.js',
    required: false,
  })
  @IsString({ message: 'Bio deve ser uma string' })
  @IsOptional()
  bio?: string;
}