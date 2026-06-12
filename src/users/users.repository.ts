import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role } from '@/generated/prisma';

export const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isBlocked: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: string | number;
  total_spent: string | number;
  registered_at: Date;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserDto) {
    const { password, ...rest } = data;
    return this.prisma.user.create({
      data: { ...rest, hashedPassword: password },
      select: USER_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT });
  }

  async findCustomers(query: {
    search?: string;
    sort?: 'id' | 'name' | 'email' | 'phone' | 'total_orders' | 'total_spent' | 'registered_at';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const search = query.search?.trim();
    const sortKey = query.sort ?? 'registered_at';
    const orderDirection = query.order === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(query.limit ?? 10, 100);
    const page = Math.max(query.page ?? 1, 1);
    const offset = (page - 1) * limit;

    const where: any = { role: Role.USER };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.user.count({ where });

    // If sorting by aggregated fields, compute aggregates for all matching users,
    // sort in-memory, then paginate. For other sorts, use Prisma orderBy with pagination.
    if (sortKey === 'total_orders' || sortKey === 'total_spent') {
      const allUsers = await this.prisma.user.findMany({ where, select: { id: true, name: true, email: true, phone: true, createdAt: true } });
      const userIds = allUsers.map((u) => u.id);
      const aggregates = await this.aggregateForUserIds(userIds);
      const aggMap = new Map(aggregates.map((a: any) => [a.userId, a]));

      const rows = allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        total_orders: aggMap.get(u.id)?.total_orders ?? 0,
        total_spent: aggMap.get(u.id)?.total_spent ?? 0,
        registered_at: u.createdAt,
      }));

      rows.sort((a, b) => {
        const dir = orderDirection === 'asc' ? 1 : -1;
        if (sortKey === 'total_orders') return dir * (a.total_orders - b.total_orders);
        return dir * (a.total_spent - b.total_spent);
      });

      const paged = rows.slice(offset, offset + limit);
      return { items: paged, total };
    }

    const orderBy: any = {};
    if (sortKey === 'registered_at') orderBy.createdAt = orderDirection;
    else orderBy[sortKey] = orderDirection;

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    const userIds = users.map((u) => u.id);
    const aggregates = await this.aggregateForUserIds(userIds);
    const aggMap = new Map(aggregates.map((a: any) => [a.userId, a]));

    const items = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      total_orders: aggMap.get(u.id)?.total_orders ?? 0,
      total_spent: aggMap.get(u.id)?.total_spent ?? 0,
      registered_at: u.createdAt,
    }));

    return { items, total };
  }

  async findCustomerDetail(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        role: Role.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        address: {
          select: {
            id: true,
            name: true,
            phone: true,
            provinceName: true,
            cityName: true,
            districtName: true,
            subdistrictName: true,
            postalCode: true,
            road: true,
            completeAddress: true,
            detail: true,
            usedFor: true,
          },
        },
      },
    });
  }

  async aggregateCustomerOrders(userId: string) {
    return this.prisma.order.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: {
        subtotalIdr: true,
        taxIdr: true,
        shippingCostIdr: true,
      },
      _max: { createdAt: true },
    });
  }

  async findCustomerOrderHistory(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        subtotalIdr: true,
        taxIdr: true,
        shippingCostIdr: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 10,
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      subtotalIdr: Number(order.subtotalIdr),
      taxIdr: Number(order.taxIdr),
      shippingCostIdr: Number(order.shippingCostIdr),
      total_amount:
        Number(order.subtotalIdr) + Number(order.taxIdr) + Number(order.shippingCostIdr),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  async aggregateForUserIds(userIds: string[]) {
    if (!userIds || userIds.length === 0) return [];

    const groups = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
      _sum: { subtotalIdr: true, taxIdr: true, shippingCostIdr: true },
      _max: { createdAt: true },
    });

    return groups.map((g) => ({
      userId: g.userId,
      total_orders: Number(g._count?.id ?? 0),
      total_spent:
        Number(g._sum?.subtotalIdr ?? 0) +
        Number(g._sum?.taxIdr ?? 0) +
        Number(g._sum?.shippingCostIdr ?? 0),
      average_order_value:
        (Number(g._sum?.subtotalIdr ?? 0) +
          Number(g._sum?.taxIdr ?? 0) +
          Number(g._sum?.shippingCostIdr ?? 0)) /
        (Number(g._count?.id ?? 0) || 1),
      last_order_date: g._max?.createdAt ?? null,
    }));
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_SELECT,
    });
  }

  update(id: string, data: UpdateUserDto) {
    const updateData: Record<string, unknown> = { ...data };
    if ('password' in data && data.password !== undefined) {
      delete updateData.password;
      updateData.hashedPassword = data.password;
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
  }

  setBlocked(id: string, isBlocked: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: USER_SELECT,
    });
  }

  delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: USER_SELECT,
    });
  }
}
