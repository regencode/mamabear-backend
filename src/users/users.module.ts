import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CustomersController } from './customers.controller';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [UsersController, CustomersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
