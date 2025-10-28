import { DataSource } from 'typeorm';
import { UserRepository } from './repositories/user.repository';
import { USER_REPOSITORY } from './constants';

export const usersProviders = [
  {
    provide: USER_REPOSITORY,
    useFactory: (dataSource: DataSource) => new UserRepository(dataSource),
    inject: [DataSource],
  },
];