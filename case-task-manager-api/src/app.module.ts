import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './api/users/users.module';
import { AuthModule } from './api/auth/auth.module';
import { TasksModule } from './api/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'case_task_manager',
      entities: [__dirname + '/api/**/entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: ['query', 'error', 'schema', 'warn', 'info', 'log'],
    }),
    UsersModule,
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
