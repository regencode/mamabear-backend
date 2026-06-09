import { Role, OrderStatus } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getOrderCount() {
    return this.prisma.order.count();
  }

  getCustomerCount() {
    return this.prisma.user.count({
      where: {
        role: Role.USER,
      },
    });
  }

  getProductCount() {
    return this.prisma.product.count({
      where: {
        isActive: true,
      },
    });
  }

  getRecentOrder() {
    return this.prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        orderItems: {
          select: {
            product: {
              select: {
                name: true,
              },
            },
            variant: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  getLowStockProducts() {
    return this.prisma.productVariant.findMany({
      where: {
        stock: {
          lte: 100,
        },
      },
      take: 10,
      orderBy: {
        stock: 'asc',
      },
      select: {
        name: true,
        stock: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  getTopSellingProducts() {
    return this.prisma.product.findMany({
      take: 10,
      orderBy: {
        totalSold: 'desc',
      },
      select: {
        name: true,
        totalSold: true,
        variants: {
          select: {
            name: true,
            priceIdr: true,
          },
        },
      },
    });
  }

  getRevenueOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.PAYMENT_PAID,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSED,
            OrderStatus.SENDING,
            OrderStatus.RECEIVED,
            OrderStatus.COMPLETED,
          ],
        },
      },

      select: {
        subtotalIdr: true,
        taxIdr: true,
        shippingCostIdr: true,
      },
    });
  }
}
