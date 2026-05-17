import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

const CART_INCLUDE = {
  items: {
    include: {
      product: true,
      variant: true,
    },
  },
};

const CART_ITEM_INCLUDE = {
  product: true,
  variant: true,
};

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCartById(id: string) {
    return this.prisma.cart.findUnique({
      where: { id },
      include: CART_INCLUDE,
    });
  }

  async findCartByUser(userId: string) {
    return this.prisma.cart.findFirst({
      where: { userId },
      include: CART_INCLUDE,
    });
  }

  async findCartBySession(sessionId: string) {
    return this.prisma.cart.findFirst({
      where: { sessionId },
      include: CART_INCLUDE,
    });
  }

  async createCart(data: { userId?: string | null; sessionId?: string | null; expiresAt?: Date }) {
    return this.prisma.cart.create({
      data,
      include: CART_INCLUDE,
    });
  }

  async findCartWithItems(userId?: string, sessionId?: string) {
    const where = userId ? { userId } : { sessionId };
    return this.prisma.cart.findFirst({
      where,
      include: CART_INCLUDE,
    });
  }

  async upsertCartItem(data: {
    cartId: string;
    productId: number;
    variantId: number | null;
    quantity?: number;
    price: any;
    increment?: boolean;
  }) {
    const variantId = data.variantId ?? null;
    const where = {
      cartId_productId_variantId: {
        cartId: data.cartId,
        productId: data.productId,
        variantId: variantId as number | null,
      },
    };

    const update = data.increment
      ? { quantity: { increment: data.quantity ?? 1 } }
      : { quantity: data.quantity };

    return this.prisma.cartItem.upsert({
      where: where as any,
      update,
      create: {
        cartId: data.cartId,
        productId: data.productId,
        variantId: variantId,
        quantity: data.quantity ?? 1,
        price: data.price,
      },
    });
  }

  async findCartItemById(id: string) {
    return this.prisma.cartItem.findUnique({
      where: { id },
      include: CART_ITEM_INCLUDE,
    });
  }

  async updateCartItemQuantity(itemsId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemsId },
      data: { quantity },
    });
  }

  async deleteCartItem(itemsId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemsId },
    });
  }

  async deleteCartItems(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async deleteCart(cartId: string) {
    return this.prisma.cart.delete({
      where: { id: cartId },
    });
  }

  async findExpiredCarts() {
    return this.prisma.cart.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      include: { items: true },
    });
  }

  async deleteExpiredCarts() {
    return this.prisma.cart.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}