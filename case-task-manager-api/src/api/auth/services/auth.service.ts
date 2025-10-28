import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { LoginUserDto, AuthResponseDto, RegisterResponseDto } from '../dtos';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dtos/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    // Verificar se o usuário já existe
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Usuário com este email já existe');
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Criar usuário
    const userData = {
      ...createUserDto,
      password: hashedPassword,
    };

    const user = await this.usersService.create(userData);

    return {
      success: true,
      message: 'Usuário criado com sucesso',
      user: new UserResponseDto(user),
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    // Buscar usuário por email
    const user = await this.usersService.findByEmail(loginUserDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      access_token,
      user: new UserResponseDto(user),
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return await this.usersService.findOne(userId);
  }
}