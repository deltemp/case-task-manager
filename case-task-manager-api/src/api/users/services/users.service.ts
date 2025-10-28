import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import { USER_REPOSITORY } from '../constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return new UserResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findActiveUsers();
    return users.map(user => new UserResponseDto(user));
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { id, deletedAt: IsNull() } 
    });
    
    return user || null;
  }

  async findOneForResponse(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ 
      where: { id, deletedAt: IsNull() } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ 
      where: { id, deletedAt: IsNull() } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    
    return new UserResponseDto(updatedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id, deletedAt: IsNull() } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDeleteUser(id);
  }
}