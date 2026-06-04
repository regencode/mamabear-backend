import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tx: Prisma.TransactionClient, data: Prisma.OrderCreateInput) {
    return tx.order.create({
      data,
      include: {
        orderItems: true,
        shippingAddress: true,
        orderStatusHistory: true,
      },
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
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
              },
            },
            variant: {
              select: {
                name: true,
                stock: true,
                priceIdr: true,
                images: {
                  take: 1,
                  select: { imageUrl: true, altText: true },
                },
              },
            },
          },
        },
        shippingAddress: true,
        orderStatusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  incrementProductSold(productId: number, variantId: number, quantity: number) {
    return this.prisma.$transaction(async (tx) => {
        const product = await tx.product.update({
          where: {
            id: productId,
          },
          data: {
            totalSold: {
              increment: quantity,
            },
          },
        });
        const variant = this.prisma.productVariant.update({
          where: {
            id: variantId,
            productId: product.id,
          },
          data: {
            stock: {
                decrement: quantity,
            }
          },
        });
        return variant;
     })
  }

  findOneForAdmin(orderId: string) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  select: { imageUrl: true, altText: true },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                priceIdr: true,
                stock: true,
                sku: true,
                weightG: true,
              },
            },
          },
        },
        shippingAddress: true,
        orderStatusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  findAddressById(userId: string, addressId: number) {
    return this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
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
            variant: {
              include: {
                discount: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  findOrderForInvoice(orderId: string) {
    return this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        shippingAddress: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                weightG: true,
                priceIdr: true,
              },
            },
          },
        },
      },
    });
  }
}
