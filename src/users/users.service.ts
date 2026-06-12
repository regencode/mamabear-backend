import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'pino-nestjs';
import { format } from 'fast-csv';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository, USER_SELECT } from './users.repository';
import { ServiceResult } from '@/common/ServiceResult';
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

  async findCustomerDetail(id: string): Promise<ServiceResult<AdminCustomerDetail>> {
    try {
      const customer = await this.usersRepository.findCustomerDetail(id);
      if (!customer) {
        this.logger.warn({
          message: 'Customer not found',
          endpoint: 'GET /admin/customers/:id',
          customerId: id,
          status: 'failure',
        });
        throw new NotFoundException(`Customer with id ${id} not found`);
      }

      const orderStats = await this.usersRepository.aggregateCustomerOrders(id);
      const orderHistory = await this.usersRepository.findCustomerOrderHistory(id);
      const totalSpent = Number(orderStats._sum.subtotalIdr ?? 0) +
        Number(orderStats._sum.taxIdr ?? 0) +
        Number(orderStats._sum.shippingCostIdr ?? 0);
      const totalOrders = Number(orderStats._count.id ?? 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      const result: AdminCustomerDetail = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        isVerified: customer.isVerified,
        registered_at: customer.createdAt,
        updated_at: customer.updatedAt ?? null,
        addresses: customer.address,
        total_orders: totalOrders,
        total_spent: totalSpent,
        average_order_value: averageOrderValue,
        last_order_date: orderStats._max.createdAt ?? null,
        order_history: orderHistory,
      };

      this.logger.info({
        message: 'Retrieved admin customer detail',
        endpoint: 'GET /admin/customers/:id',
        customerId: id,
        status: 'success',
      });
      return {
        success: true,
        message: `Found customer detail for id ${id}`,
        data: result,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        message: 'Failed to retrieve admin customer detail',
        endpoint: 'GET /admin/customers/:id',
        customerId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async exportCustomersToCSV(query: ListCustomersQueryDto, res: Response): Promise<void> {
    try {
      const { items } = await this.usersRepository.findCustomers(query);

      const csvData = items.map((customer) => ({
        ID: customer.id,
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        'Total Orders': customer.total_orders,
        'Total Spent': customer.total_spent,
        'Registered At': new Date(customer.registered_at).toISOString(),
      }));

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`);

      const csvStream = format({ headers: true });
      csvStream.pipe(res);

      csvData.forEach((row) => csvStream.write(row));
      csvStream.end();

      this.logger.info({
        message: 'Exported admin customers to CSV',
        endpoint: 'GET /admin/customers/export',
        total: items.length,
        status: 'success',
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to export admin customers to CSV',
        endpoint: 'GET /admin/customers/export',
        status: 'error',
        error: error.message,
      });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          statusCode: 500,
          message: ['Failed to export customers'],
          data: null,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}
