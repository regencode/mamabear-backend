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
    const allowedSortMap: Record<string, string> = {
      id: '"u"."id"',
      name: '"u"."name"',
      email: '"u"."email"',
      phone: '"u"."phone"',
      total_orders: '"total_orders"',
      total_spent: '"total_spent"',
      registered_at: '"u"."createdAt"',
    };

    const search = query.search?.trim();
    const sortKey = query.sort ?? 'registered_at';
    const orderDirection = query.order === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(query.limit ?? 10, 100);
    const page = Math.max(query.page ?? 1, 1);
    const offset = (page - 1) * limit;
    const sortClause = allowedSortMap[sortKey] ?? allowedSortMap.registered_at;

    const searchClause = search
      ? Prisma.sql`
      AND (
        "u"."name" ILIKE ${`%${search}%`} OR
        "u"."email" ILIKE ${`%${search}%`} OR
        "u"."phone" ILIKE ${`%${search}%`}
      )
    `
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<AdminCustomerRow[]>` 
      SELECT
        "u"."id",
        "u"."name",
        "u"."email",
        "u"."phone",
        COUNT("o"."id") AS "total_orders",
        COALESCE(SUM("o"."subtotalIdr" + "o"."taxIdr" + "o"."shippingCostIdr"), 0) AS "total_spent",
        "u"."createdAt" AS "registered_at"
      FROM "User" AS "u"
      LEFT JOIN "Order" AS "o" ON "o"."userId" = "u"."id"
      WHERE "u"."role" = ${Role.USER}
      ${searchClause}
      GROUP BY "u"."id"
      ORDER BY ${Prisma.raw(sortClause)} ${Prisma.raw(orderDirection)}
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const countResult = await this.prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*) AS count
      FROM "User" AS "u"
      WHERE "u"."role" = ${Role.USER}
      ${searchClause}
    `;

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        total_orders: Number(row.total_orders),
        total_spent: Number(row.total_spent),
        registered_at: row.registered_at,
      })),
      total: Number(countResult[0]?.count ?? 0),
    };
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

  delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: USER_SELECT,
    });
  }
}
