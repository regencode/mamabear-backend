import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: PinoLogger,
  ) {this.logger.setContext(UsersService.name);}

  async create(createUserDto: CreateUserDto) {
    try {
      const result = await this.usersRepository.create(createUserDto);
      this.logger.info({
        level: 'info',
        message: 'User created successfully',
        endpoint: 'POST /users',
        email: createUserDto.email,
        userId: result.id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'User creation failed',
        endpoint: 'POST /users',
        email: createUserDto.email,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findAll() {
    try {
      const result = await this.usersRepository.findAll();
      this.logger.info({
        level: 'info',
        message: 'Retrieved all users',
        endpoint: 'GET /users',
        count: result.length,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve users',
        endpoint: 'GET /users',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.usersRepository.findById(id);
      if (!user) {
        this.logger.warn({
          level: 'warn',
          message: 'User not found',
          endpoint: 'GET /users/:id',
          userId: id,
          status: 'failure',
        });
        throw new NotFoundException(`User with id ${id} not found`);
      }
      this.logger.info({
        level: 'info',
        message: 'Retrieved user by id',
        endpoint: 'GET /users/:id',
        userId: id,
        status: 'success',
      });
      return user;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve user',
        endpoint: 'GET /users/:id',
        userId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const result = await this.usersRepository.update(id, updateUserDto);
      this.logger.info({
        level: 'info',
        message: 'User updated successfully',
        endpoint: 'PATCH /users/:id',
        userId: id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'User update failed',
        endpoint: 'PATCH /users/:id',
        userId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const result = await this.usersRepository.delete(id);
      this.logger.info({
        level: 'info',
        message: 'User deleted successfully',
        endpoint: 'DELETE /users/:id',
        userId: id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'User deletion failed',
        endpoint: 'DELETE /users/:id',
        userId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }
}
