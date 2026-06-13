import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'pino-nestjs';
import { format } from 'fast-csv';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersRepository, USER_SELECT } from './users.repository';
import { ServiceResult } from '@/common/ServiceResult';
import { Prisma, Role } from '@/generated/prisma';
import { AdminCustomersQueryDto } from './dto/admin-customers-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import {
  PagePaginationResponseDto,
  PagePaginationMetaDto,
} from '@/common/dto/response/page-pagination.response.dto';
import { Prisma, OrderStatus, Role } from '@/generated/prisma';
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

type AdminCustomerOrderSummary = {
  id: string;
  status: OrderStatus;
  subtotalIdr: number;
  taxIdr: number;
  shippingCostIdr: number;
  total_amount: number;
  createdAt: Date;
  updatedAt: Date;
};

type AdminCustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  registered_at: Date;
  updated_at: Date | null;
  addresses: Array<{
    id: number;
    name: string;
    phone: string;
    provinceName: string;
    cityName: string;
    districtName: string;
    subdistrictName: string;
    postalCode: string;
    road: string;
    completeAddress: string;
    detail: string | null;
    usedFor: string;
  }>;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: Date | null;
  order_history: AdminCustomerOrderSummary[];
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

  async updateRole(
    targetId: string,
    dto: UpdateUserRoleDto,
    currentUser: { id: string; role: Role },
  ): Promise<ServiceResult<UserPublic>> {
    if (targetId === currentUser.id) {
      throw new BadRequestException('Cannot change your own role');
    }

    const target = await this.usersRepository.findById(targetId);
    if (!target) {
      throw new NotFoundException(`User with id ${targetId} not found`);
    }

    if (
      target.role === Role.SUPERADMIN &&
      currentUser.role !== Role.SUPERADMIN
    ) {
      throw new BadRequestException(
        'Only a SUPERADMIN can modify another SUPERADMIN',
      );
    }

    if (dto.role === Role.SUPERADMIN && currentUser.role !== Role.SUPERADMIN) {
      throw new BadRequestException(
        'Only a SUPERADMIN can assign the SUPERADMIN role',
      );
    }

    const result = await this.usersRepository.update(targetId, {
      role: dto.role,
    });
    return {
      success: true,
      message: `User role updated to ${dto.role}`,
      data: result,
    };
  }

  async updateStatus(
    targetId: string,
    dto: UpdateUserStatusDto,
    currentUser: { id: string; role: Role },
  ): Promise<ServiceResult<UserPublic>> {
    if (targetId === currentUser.id) {
      throw new BadRequestException('Cannot change your own status');
    }

    const target = await this.usersRepository.findById(targetId);
    if (!target) {
      throw new NotFoundException(`User with id ${targetId} not found`);
    }

    if (
      target.role === Role.SUPERADMIN &&
      currentUser.role !== Role.SUPERADMIN
    ) {
      throw new BadRequestException(
        'Only a SUPERADMIN can modify another SUPERADMIN',
      );
    }

    const result = await this.usersRepository.update(targetId, {
      isVerified: dto.isVerified,
    });
    return {
      success: true,
      message: `User verification status updated to ${dto.isVerified}`,
      data: result,
    };
  }

  async exportCustomersCsv(
    query: AdminCustomersQueryDto,
  ): Promise<string> {
    const customers = await this.usersRepository.exportCustomers(query);

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Verified',
      'Total Orders',
      'Total Spent (IDR)',
      'Avg Order Value (IDR)',
      'Last Order Date',
      'Registered At',
    ].join(',');

    const rows = customers.map((c) =>
      [
        escapeCsv(c.id),
        escapeCsv(c.name),
        escapeCsv(c.email),
        escapeCsv(c.phone),
        escapeCsv(c.isVerified ? 'Yes' : 'No'),
        escapeCsv(c.totalOrders),
        escapeCsv(c.totalSpent),
        escapeCsv(c.averageOrderValue),
        escapeCsv(c.lastOrderDate ? new Date(c.lastOrderDate).toISOString() : ''),
        escapeCsv(new Date(c.createdAt).toISOString()),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async findCustomers(
    query: AdminCustomersQueryDto,
  ): Promise<ServiceResult<PagePaginationResponseDto<any>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, totalItems } =
      await this.usersRepository.findCustomers(query);
    const meta = new PagePaginationMetaDto(page, limit, totalItems);
    const result = new PagePaginationResponseDto(items, meta);
    return {
      success: true,
      message: `Returned ${items.length} customers (page ${page} of ${meta.totalPages})`,
      data: result,
    };
  }

  async findCustomerDetail(
    id: string,
  ): Promise<ServiceResult<any>> {
    const customer = await this.usersRepository.findCustomerDetail(id);
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return {
      success: true,
      message: `Found customer with id ${id}`,
      data: customer,
    };
  }

  async findAdminUsers(
    query: AdminUsersQueryDto,
  ): Promise<ServiceResult<PagePaginationResponseDto<any>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, totalItems } =
      await this.usersRepository.findAdminUsers(query);
    const meta = new PagePaginationMetaDto(page, limit, totalItems);
    const result = new PagePaginationResponseDto(items, meta);
    return {
      success: true,
      message: `Returned ${items.length} admin users (page ${page} of ${meta.totalPages})`,
      data: result,
    };
  }
}
