import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tx: Prisma.TransactionClient, data: Prisma.OrderCreateInput) {
    return tx.order.create({
      data,
      include: { items: true, address: true, histories: true },
    });
  }

  update(where: Prisma.OrderWhereUniqueInput, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where,
      data,
    });
  }

  findOne(userId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: {
        userId,
        id: orderId,
      },
      include: {
        items: true,
        address: true,
        histories: true,
      },
    });
  }

  findOneForAdmin(orderId: string) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        items: true,
        address: true,
        histories: true,
      },
    });
  }

  findMany(args: Prisma.OrderFindManyArgs) {
    return this.prisma.order.findMany(args);
  }

  findUser(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  findCartByUserId(userId: string) {
    return this.prisma.cart.findFirst({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            variant: true,
            product: true,
          },
        },
      },
    });
  }
}
