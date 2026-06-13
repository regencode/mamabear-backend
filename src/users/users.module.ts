import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [UsersController, AdminCustomersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
