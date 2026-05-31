import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderRepository } from './order.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, PaymentStatus, Prisma, Role } from '@/generated/prisma';
import { PinoLogger } from 'pino-nestjs';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CursorPaginationService } from '@/common/services/pagination.service';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly paginationService: CursorPaginationService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cart = await this.repo.findCartByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cart.items) {
      if (!item.variant) {
        throw new BadRequestException(`Variant not found for item ${item.id}`);
      }

      if (!item.product) {
        throw new BadRequestException(`Product not found for item ${item.id}`);
      }
    }

    const subTotal = cart.items.reduce((acc, item) => {
      return acc + Number(item.price) * item.quantity;
    }, 0);

    const shippingCost = 10000;
    const tax = subTotal * 0.11;
    const grandTotal = subTotal + shippingCost + tax;

    const orderNumber = `ORD-${Date.now()}`;
    const pendingExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const makeOrder = await this.prisma.$transaction(async (tx) => {
      const orderPayload: Prisma.OrderCreateInput = {
        orderNumber,

        user: {
          connect: {
            id: userId,
          },
        },
        status: OrderStatus.PENDING,
        subtotalIdr: new Prisma.Decimal(subTotal),
        shippingCostIdr: new Prisma.Decimal(shippingCost),
        taxIdr: new Prisma.Decimal(tax),
        grandTotal: new Prisma.Decimal(grandTotal),
        shippingMethod: dto.shippingMethod,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        pendingExpiresAt,
        notes: dto.notes,
        address: {
          create: {
            ...dto.address,
          },
        },
        items: {
          create: cart.items.map((item) => ({
            product: {
              connect: {
                id: item.productId,
              },
            },
            variant: {
              connect: {
                id: item.variantId,
              },
            },
            productName: item.product.name,
            variantName: item.variant.name,
            priceIdr: item.price,
            quantity: item.quantity,
            grandPrice: new Prisma.Decimal(Number(item.price) * item.quantity),
          })),
        },
        histories: {
          create: {
            status: OrderStatus.PENDING,
            notes: 'Order created',
          },
        },
      };

      const order = await this.repo.create(tx, orderPayload);

      for (const item of cart.items) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `Variant ${item.variantId} is out of stock`,
          );
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return order;
    });

    return {
      success: true,
      message: 'Order created successfully',
      data: makeOrder,
    };
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    dto: UpdateOrderDto,
  ) {
    const order = await this.repo.findOneForAdmin(orderId);
    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('login to update order');
    }

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        histories: {
          create: {
            status: dto.status,
            notes: `Order status updated to ${dto.status} by ${user.name}`,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Order status updated successfully',
      data: updated,
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.repo.findOneForAdmin(orderId);
    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('login to cancel order');
    }

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }

    if (order.status === OrderStatus.SHIPPED) {
      throw new BadRequestException('Shipped order cannot be cancelled');
    }

    if (order.status === OrderStatus.RECEIVED) {
      throw new BadRequestException('Completed order cannot be cancelled');
    }

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: {
            id: item.variantId,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.CANCELLED,

          histories: {
            create: {
              status: OrderStatus.CANCELLED,
              notes: `Order cancelled by ${user.name}`,
            },
          },
        },
        include: {
          items: true,
          histories: true,
          address: true,
        },
      });

      return updatedOrder;
    });

    return {
      success: true,
      message: `Order ${order.orderNumber} cancelled successfully by ${user.name}`,
      data: cancelledOrder,
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.repo.findOne(userId, orderId);
    const orderForAdmin = await this.repo.findOneForAdmin(orderId);

    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('login to see order');
    }

    if (user.role === Role.ADMIN) {
      return {
        success: true,
        message: 'Order retrieved successfully by Admin',
        data: orderForAdmin,
      };
    }

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (userId !== order.userId) {
      throw new BadRequestException('Unauthorized access to order');
    }
    return {
      success: true,
      message: `Order retrieved successfully ${user?.name}`,
      data: order,
    };
  }

  async getOrdersByUserId(userId: string, paginationDto: OrderPaginationDto) {
    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('Login required');
    }

    const {
      cursor,
      limit = 10,
      search,
      status,
      customer,
      startDate,
      endDate,
    } = paginationDto;

    const where: Prisma.OrderWhereInput = {};

    if (user.role !== Role.ADMIN) {
      where.userId = userId;
    }

    if (search) {
      where.orderNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status;
    }

    if (customer) {
      where.user = {
        OR: [
          {
            name: {
              contains: customer,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: customer,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    const createdAtFilter: Prisma.DateTimeFilter = {};

    if (startDate || endDate) {
      where.createdAt = {} as Prisma.DateTimeFilter;
    }

    if (startDate) {
      createdAtFilter.gte = new Date(startDate);
    }

    if (endDate) {
      const finalDate = new Date(endDate);
      finalDate.setHours(23, 59, 59, 999);

      createdAtFilter.lte = finalDate;
    }

    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    const orders = await this.repo.findMany({
      where,

      take: limit + 1,

      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        items: true,
        address: true,
        histories: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    let nextCursor: string | null = null;

    if (orders.length > limit) {
      const nextItem = orders.pop();

      nextCursor = nextItem?.id ?? null;
    }

    return {
      success: true,

      message:
        user.role === Role.ADMIN
          ? 'Orders retrieved successfully by Admin'
          : `Orders retrieved successfully ${user.name}`,

      data: {
        items: orders,

        meta: {
          limit,
          nextCursor,
        },
      },
    };
  }
}
