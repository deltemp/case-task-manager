import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { LoginUserDto, AuthResponseDto, RegisterResponseDto } from '../dtos';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Usuário com este email já existe',
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login do usuário' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    return this.authService.login(loginUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário autenticado',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async getCurrentUser(@CurrentUser() user: User): Promise<UserResponseDto> {
    return new UserResponseDto(user);
  }
}