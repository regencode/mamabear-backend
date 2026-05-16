import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart-dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // Get or Create Cart
  async getOrCreateCart(userId?: string, sessionId?: string) {
    let cart = null;

    if (userId) {
      cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });
    } else if (sessionId) {
      cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: { items: true },
      });
    }

    if (cart) return cart;

    return this.prisma.cart.create({
      data: {
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        expiresAt: sessionId
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          : null,
      },
    });
  }

  // Add Item to Cart
  async addToCart(dto: AddToCartDto, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // get product / variant price
    let price: any;

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      price = variant.priceIdr;
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('Product not found');

      // fallback (if no variant system used)
      price = 0;
    }

    return this.prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId ?? null,
        },
      },
      update: {
        quantity: {
          increment: dto.quantity ?? 1,
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity ?? 1,
        price,
      },
    });
  }

  // Update Quantity
  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  // Remove Item
  async removeItem(itemId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  // Clear Cart
  async clearCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  // Get Full Cart (with relations)
  async getCart(userId?: string, sessionId?: string) {
    const where = userId ? { userId } : { sessionId };

    return this.prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  // Merge Guest Cart → User Cart
  async mergeCart(userId: string, sessionId: string) {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart) return null;

    const userCart = await this.getOrCreateCart(userId);

    for (const item of guestCart.items) {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId_variantId: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
          },
        },
        update: {
          quantity: { increment: item.quantity },
        },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        },
      });
    }

    // delete guest cart
    await this.prisma.cart.delete({
      where: { id: guestCart.id },
    });

    return userCart;
  }

  // Cleanup Expired Carts (for cron)
  async cleanupExpiredCarts() {
    return this.prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
