import { Injectable } from '@nestjs/common';
import { Repository, DataSource, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.find({ where: { deletedAt: IsNull() } });
  }

  async softDeleteUser(id: number): Promise<void> {
    await this.update(id, { deletedAt: new Date() });
  }
}