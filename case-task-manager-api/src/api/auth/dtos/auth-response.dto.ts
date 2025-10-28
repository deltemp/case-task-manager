import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Token JWT para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Usuário criado com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Dados do usuário criado',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}