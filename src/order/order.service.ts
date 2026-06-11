import { Order, Prisma, Role } from '@/generated/prisma';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from './order.repository';
import { ServiceResult } from '@/common/ServiceResult';
import { OrderStatus } from '@/generated/prisma';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { MailService } from '@/auth/mail.service';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { InvoicePaymentStatus, InvoiceStructure } from '@/types/invoice.type';

@Injectable()
export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly mailService: MailService,
  ) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<ServiceResult<Order>> {
    const user = await this.repo.findUser(userId);
    if (!user) throw new NotFoundException('User not found');

    const order = await this.repo.createOrder(userId, dto);
    await this.mailService.orderConfirmationEmail(user.email, order.id);
    return {
      success: true,
      message: `Order ${order.id} created successfully`,
      data: order,
    };
  }

  async getOrderById(
    userId: string,
    orderId: string,
  ): Promise<ServiceResult<Order>> {
    const order = await this.repo.findOne(userId, orderId);
    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);
    return {
      success: true,
      message: 'Order found',
      data: order,
    };
  }

  async getOrdersByUserId(userId: string, paginationDto: OrderPaginationDto) {
    const where: Prisma.OrderWhereInput = { userId };

    if (paginationDto.status) {
      where.status = paginationDto.status;
    }
    if (paginationDto.search) {
      where.notes = { contains: paginationDto.search, mode: 'insensitive' };
    }
    if (paginationDto.startDate || paginationDto.endDate) {
      where.createdAt = {};
      if (paginationDto.startDate)
        where.createdAt.gte = new Date(paginationDto.startDate);
      if (paginationDto.endDate)
        where.createdAt.lte = new Date(paginationDto.endDate);
    }

    const limit = paginationDto.limit ?? 10;
    const orders = await this.repo.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, slug: true } },
            variant: {
              select: {
                name: true,
                priceIdr: true,
                images: { take: 1, select: { imageUrl: true, altText: true } },
              },
            },
          },
        },
        shippingAddress: true,
      },
      take: limit + 1,
      cursor: paginationDto.cursor ? { id: paginationDto.cursor } : undefined,
      skip: paginationDto.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | null = null;
    if (orders.length > limit) {
      orders.pop();
      nextCursor = orders[orders.length - 1]?.id ?? null;
    }

    return {
      success: true,
      data: orders,
      pagination: { limit, nextCursor, hasNextPage: nextCursor !== null },
    };
  }

  async cancelOrder(
    userId: string,
    orderId: string,
    reason?: string,
  ): Promise<ServiceResult<null>> {
    const order = await this.repo.findOneForAdmin(orderId);
    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);

    await this.repo.update({ id: orderId }, { status: OrderStatus.CANCELLED });
    await this.repo.createOrderStatusHistory(
      orderId,
      OrderStatus.CANCELLED,
      reason,
    );
    return {
      success: true,
      message: `Order ${orderId} cancelled`,
      data: null,
    };
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    dto: UpdateOrderDto,
  ): Promise<ServiceResult<Order>> {
    const order = await this.repo.findOneForAdmin(orderId);
    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);

    const status = dto.status ?? order.status;
    const updatedOrder = await this.repo.update({ id: orderId }, { status });
    await this.repo.createOrderStatusHistory(orderId, status, dto.notes);
    return {
      success: true,
      message: `Order ${orderId} status updated to ${status}`,
      data: updatedOrder,
    };
  }

  async updateTrackingNumber(orderId: string, dto: UpdateTrackingDto) {
    const order = await this.repo.findOneForAdmin(orderId);
    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);

    const trackingNumber = dto.trackingNumber;

    return this.repo.update({ id: orderId }, { trackingNumber });
  }

  async getInvoice(
    userId: string,
    role: Role,
    orderId: string,
  ): Promise<InvoiceStructure> {
    const order =
      role === Role.ADMIN || role === Role.SUPERADMIN
        ? await this.repo.findOneForAdmin(orderId)
        : await this.repo.findOne(userId, orderId);

    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);

    const INVALID_STATUSES: OrderStatus[] = [
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
      OrderStatus.REFUNDED,
      OrderStatus.PAYMENT_FAILED,
    ];

    if (INVALID_STATUSES.includes(order.status))
      throw new BadRequestException(
        "Can't generate invoice in current order status",
      );

    const datePart = order.createdAt
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const invoicePaymentStatus =
      order.status === OrderStatus.PAYMENT_PAID
        ? InvoicePaymentStatus.PAID
        : InvoicePaymentStatus.UNPAID;

    return {
      invoiceNumber: `INV-${datePart}-${order.id.slice(0, 6).toUpperCase()}`,
      issuedAt: new Date(),
      OrderedItem: order.orderItems.map((item) => ({
        productName: item.product.name,
        variantName: item.variant.name,
        quantity: item.quantity,
        price: item.variant.priceIdr.toString(),
      })),
      ShippingAddress:
        order.shippingAddress?.completeAddress ?? 'Address not found',
      subtotalIdr: order.subtotalIdr.toString(),
      shippingCostIdr: order.shippingCostIdr.toString(),
      totalIdr: (order.subtotalIdr + order.shippingCostIdr).toString(),
      PaymentMethod: order.paymentMethod?.toUpperCase() ?? 'Method not found',
      InvoicePaymentStatus: invoicePaymentStatus,
    };
  }
}
