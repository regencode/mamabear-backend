import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderRepository } from './order.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { Order, OrderStatus, Prisma, Role } from '@/generated/prisma';
import { PinoLogger } from 'pino-nestjs';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CursorPaginationService } from '@/common/services/pagination.service';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ShippingService } from '@/shipping/shipping.service';
import { ServiceResult } from '@/common/ServiceResult';
import { PriceSort } from '@/shipping/dto/calculate-cost.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly paginationService: CursorPaginationService,
    private readonly shippingService: ShippingService,
  ) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<ServiceResult<Order & { grandTotal: number }> | null> {
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

    const address = await this.repo.findAddressById(userId, dto.addressId);

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const totalWeightG = cart.items.reduce((acc, item) => {
      return acc + item.variant.weightG * item.quantity;
    }, 0);

    const originSubdistrictId = process.env.ORIGIN_SUBDISTRICT_ID;

    const shippingOptions = await this.shippingService.calculateShippingCost(
        userId,
        {
          destination: address.subdistrictId,
          weightG: totalWeightG,
          priceSortDirection: PriceSort.DESCENDING,
    });

    const selectedService = shippingOptions?.find(
      (s) =>
        s.code.toLowerCase() === dto.courierCode.toLowerCase() &&
        s.service.toLowerCase() === dto.courierService.toLowerCase(),
    );

    if (!selectedService) {
      throw new BadRequestException(
        `Shipping service ${dto.courierCode} ${dto.courierService} not available for this destination`,
      );
    }

    if (!selectedService) {
      throw new BadRequestException(
        `Shipping service ${dto.courierCode} ${dto.courierService} not available for this destination`,
      );
    }

    const validatedShippingCost = selectedService.cost;

    if (validatedShippingCost !== dto.shippingCostIdr) {
      throw new BadRequestException(
        `Shipping cost mismatch. Expected ${validatedShippingCost}, got ${dto.shippingCostIdr}`,
      );
    }

    const subTotal = cart.items.reduce((acc, item) => {
      return acc + Number(item.price) * item.quantity;
    }, 0);

    const shippingCost = validatedShippingCost;
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

        status: OrderStatus.PAYMENT_PENDING,

        subtotalIdr: subTotal,

        shippingCostIdr: shippingCost,

        taxIdr: tax,

        shippingMethod: `${dto.courierCode.toUpperCase()} ${dto.courierService.toUpperCase()}`,

        paymentMethod: dto.paymentMethod,

        notes: dto.notes,

        shippingAddress: {
          create: {
            name: address.name,
            phone: address.phone,

            provinceId: address.provinceId,
            provinceName: address.provinceName,

            cityId: address.cityId,
            cityName: address.cityName,

            districtId: address.districtId,
            districtName: address.districtName,

            subdistrictId: address.subdistrictId,
            subdistrictName: address.subdistrictName,

            postalCode: address.postalCode,

            road: address.road,
            completeAddress: address.completeAddress,
            detail: address.detail,
            usedFor: address.usedFor,
          },
        },

        orderItems: {
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

            price: Number(item.price),

            quantity: item.quantity,
          })),
        },

        orderStatusHistory: {
          create: {
            status: OrderStatus.PAYMENT_PENDING,
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
      data: { ...makeOrder, grandTotal },
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

    if (
      dto.status === OrderStatus.COMPLETED &&
      order.status !== OrderStatus.COMPLETED
    ) {
      for (const item of order.orderItems) {
        await this.repo.incrementProductSold(item.productId, item.variantId, item.quantity);
      }
    }

    const updated = await this.repo.update(
      { id: orderId },
      {
        status: dto.status,
        trackingNumber: dto.trackingNumber,
        shippingMethod: dto.shippingMethod,
        notes: dto.notes,

        ...(dto.status && {
          orderStatusHistory: {
            create: {
              status: dto.status,
              notes: `Order status updated to ${dto.status} by ${user.name}`,
            },
          },
        }),
      },
    );

    return {
      success: true,
      message: 'Order status updated successfully',
      data: updated,
    };
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('Login to cancel order');
    }

    const order = await this.repo.findOneForAdmin(orderId);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.userId !== userId) {
      throw new UnauthorizedException('Unauthorized to cancel this order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }

    if (order.status === OrderStatus.SENDING) {
      throw new BadRequestException(
        'Order that is being sent cannot be cancelled',
      );
    }

    if (
      order.status === OrderStatus.RECEIVED ||
      order.status === OrderStatus.COMPLETED
    ) {
      throw new BadRequestException('Completed order cannot be cancelled');
    }

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,

          orderStatusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              notes: reason
                ? `Order cancelled by ${user.name}: ${reason}`
                : `Order cancelled by ${user.name}`,
            },
          },
        },
        include: {
          orderItems: true,
          orderStatusHistory: true,
          shippingAddress: true,
        },
      });
    });

    return {
      success: true,
      message: `Order ${order.orderNumber} cancelled successfully`,
      data: cancelledOrder,
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('Login to see order');
    }

    if (user.role === Role.ADMIN) {
      const orderForAdmin = await this.repo.findOneForAdmin(orderId);

      if (!orderForAdmin) {
        throw new BadRequestException('Order not found');
      }

      return {
        success: true,
        message: 'Order retrieved successfully by Admin',
        data: orderForAdmin,
      };
    }

    const order = await this.repo.findOne(userId, orderId);

    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.userId !== userId) {
      throw new UnauthorizedException('Unauthorized access to order');
    }

    return {
      success: true,
      message: `Order retrieved successfully`,
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

    if (customer && user.role === Role.ADMIN) {
      where.user = {
        OR: [
          { name: { contains: customer, mode: 'insensitive' } },
          { email: { contains: customer, mode: 'insensitive' } },
        ],
      };
    }

    const createdAtFilter: Prisma.DateTimeFilter = {};

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
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: true,
        shippingAddress: true,
        orderStatusHistory: {
          orderBy: { createdAt: 'desc' },
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
          : `Orders retrieved successfully`,
      data: {
        items: orders,
        meta: { limit, nextCursor },
      },
    };
  }

  async getInvoice(userId: string, orderId: string) {
    const user = await this.repo.findUser(userId);

    if (!user) {
      throw new UnauthorizedException('Login to access invoice');
    }

    const order = await this.repo.findOrderForInvoice(orderId);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.userId !== userId) {
      throw new UnauthorizedException('Unauthorized to access this invoice');
    }

    const invoiceableStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSED,
      OrderStatus.SENDING,
      OrderStatus.RECEIVED,
      OrderStatus.COMPLETED,
    ];

    if (!invoiceableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Invoice is only available for confirmed orders',
      );
    }

    const orderSeq = order.orderNumber.replace('ORD-', '');
    const now = new Date(order.createdAt);
    const yearMonth = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const invoiceNumber = `INV-${yearMonth}-${orderSeq}`;

    const subtotal = order.orderItems.reduce((acc, item) => {
      return acc + (item.price ?? 0) * item.quantity;
    }, 0);

    const grandTotal = subtotal + order.shippingCostIdr + order.taxIdr;

    return {
      success: true,
      message: 'Invoice retrieved successfully',
      data: {
        invoiceNumber,
        invoiceDate: order.createdAt,

        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentMethod: order.paymentMethod,
          shippingMethod: order.shippingMethod,
          trackingNumber: order.trackingNumber,
          notes: order.notes,
        },

        customer: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },

        shippingAddress: order.shippingAddress,

        items: order.orderItems.map((item) => ({
          productId: item.productId,
          productName: item.productName ?? item.product.name,
          variantId: item.variantId,
          variantName: item.variantName ?? item.variant.name,
          sku: item.variant.sku,
          weightG: item.variant.weightG,
          quantity: item.quantity,
          unitPrice: item.price ?? Number(item.variant.priceIdr),
          totalPrice:
            (item.price ?? Number(item.variant.priceIdr)) * item.quantity,
        })),

        summary: {
          subtotalIdr: order.subtotalIdr,
          shippingCostIdr: order.shippingCostIdr,
          taxIdr: order.taxIdr,
          grandTotalIdr: grandTotal,
        },
      },
    };
  }
}
