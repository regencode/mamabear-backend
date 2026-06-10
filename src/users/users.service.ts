import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository, USER_SELECT } from './users.repository';
import { ServiceResult } from '@/common/ServiceResult';
import { Prisma } from '@/generated/prisma';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';

type UserPublic = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

type AdminCustomerItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  registered_at: Date;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async create(createUserDto: CreateUserDto): Promise<ServiceResult<UserPublic>> {
    try {
      const resolvedUser = await this.usersRepository.findByEmail(createUserDto.email);
      if(resolvedUser) throw new BadRequestException(`User with email ${createUserDto.email} already exists`);
      const result = await this.usersRepository.create(createUserDto);
      this.logger.info({
        message: 'User created successfully',
        endpoint: 'POST /users',
        email: createUserDto.email,
        userId: result.id,
        status: 'success',
      });
      return {
        success: true,
        message: 'User created successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error({
        message: 'User creation failed',
        endpoint: 'POST /users',
        email: createUserDto.email,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findAll(): Promise<ServiceResult<UserPublic[]>> {
    try {
      const result = await this.usersRepository.findAll();
      this.logger.info({
        message: 'Retrieved all users',
        endpoint: 'GET /users',
        count: result.length,
        status: 'success',
      });
      return {
        success: true,
        message: `Found ${result.length} users`,
        data: result,
      };
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to retrieve users',
        endpoint: 'GET /users',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findOne(id: string): Promise<ServiceResult<UserPublic>> {
    try {
      const user = await this.usersRepository.findById(id);
      if (!user) {
        this.logger.warn({
          message: 'User not found',
          endpoint: 'GET /users/:id',
          userId: id,
          status: 'failure',
        });
        throw new NotFoundException(`User with id ${id} not found`);
      }
      this.logger.info({
        message: 'Retrieved user by id',
        endpoint: 'GET /users/:id',
        userId: id,
        status: 'success',
      });
      return {
        success: true,
        message: `Found user with id ${id}`,
        data: user,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        message: 'Failed to retrieve user',
        endpoint: 'GET /users/:id',
        userId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ServiceResult<UserPublic>> {
    try {
      const result = await this.usersRepository.update(id, updateUserDto);
      this.logger.info({
        message: 'User updated successfully',
        endpoint: 'PATCH /users/:id',
        userId: id,
        status: 'success',
      });
      return {
        success: true,
        message: 'User updated successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error({
        message: 'User update failed',
        endpoint: 'PATCH /users/:id',
        userId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async remove(id: string): Promise<ServiceResult<UserPublic>> {
    try {
      const result = await this.usersRepository.delete(id);
      this.logger.info({
        message: 'User deleted successfully',
        endpoint: 'DELETE /users/:id',
        userId: id,
        status: 'success',
      });
      return {
        success: true,
        message: 'User deleted successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error({
        message: 'User deletion failed',
        endpoint: 'DELETE /users/:id',
        userId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findCustomers(
    query: ListCustomersQueryDto,
  ): Promise<ServiceResult<{ items: AdminCustomerItem[]; total: number; page: number; limit: number }>> {
    try {
      const { items, total } = await this.usersRepository.findCustomers(query);
      this.logger.info({
        message: 'Retrieved admin customer list',
        endpoint: 'GET /admin/customers',
        total,
        page: query.page,
        limit: query.limit,
        status: 'success',
      });
      return {
        success: true,
        message: `Found ${items.length} customers`,
        data: {
          items,
          total,
          page: query.page ?? 1,
          limit: query.limit ?? 10,
        },
      };
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to retrieve admin customers',
        endpoint: 'GET /admin/customers',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }
}
