import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'password123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  password: string;
}