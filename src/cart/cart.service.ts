import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { AddToCartDto } from './dto/add-to-cart-dto';
import { CartRepository } from './cart.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {this.logger.setContext(CartService.name);}

  // Get or Create Cart
  async getOrCreateCart(userId?: string, sessionId?: string) {
    let cart: Awaited<ReturnType<typeof this.cartRepo.findCartByUser>> = null;

    if (userId) {
      cart = await this.cartRepo.findCartByUser(userId);
    }

    if (!cart && sessionId) {
      cart = await this.cartRepo.findCartBySession(sessionId);
    }

    if (cart) return { cart, createdSessionId: undefined };

    const data: {
      userId?: string | null;
      sessionId?: string | null;
      expiresAt?: Date;
    } = {};

    let createdSessionId: string | undefined;

    if (userId) data.userId = userId;
    if (sessionId) {
      data.sessionId = sessionId;
      data.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else {
      createdSessionId = randomUUID();
      data.sessionId = createdSessionId;
      data.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const newCart = await this.cartRepo.createCart(data);
    return { cart: newCart, createdSessionId };
  }

  // Add Item to Cart
  async addToCart(dto: AddToCartDto, userId?: string, sessionId?: string) {
    try {
      const { cart, createdSessionId } = await this.getOrCreateCart(userId, sessionId);

      // Variants are required for pricing - products don't have base prices
      if (!dto.variantId) {
        throw new BadRequestException('Variant ID is required for pricing');
      }

      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
        include: { product: true }, // Include product to validate it exists
      });

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      // Check stock availability
      const requestedQuantity = dto.quantity ?? 1;
      if (requestedQuantity > variant.stock) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${variant.stock}, Requested: ${requestedQuantity}`
        );
      }

      const result = await this.cartRepo.upsertCartItem({
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: requestedQuantity,
        price: variant.priceIdr,
        increment: true,
      });

      this.logger.info({
        level: 'info',
        message: 'Item added to cart',
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: requestedQuantity,
        status: 'success',
      });

      // Return the DB result and newly created sessionId (if any) so controller can set cookie
      return { result, createdSessionId };
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to add item to cart',
        variantId: dto.variantId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  // Update Quantity
  async updateItemQuantity(itemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        return this.removeItem(itemId);
      }

      const cartItem = await this.cartRepo.findCartItemById(itemId);

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      if (cartItem.variant && quantity > cartItem.variant.stock) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${cartItem.variant.stock}, Requested: ${quantity}`
        );
      }

      const result = await this.cartRepo.updateCartItemQuantity(itemId, quantity);
      this.logger.info({
        level: 'info',
        message: 'Cart item quantity updated',
        itemId,
        quantity,
        status: 'success',
      });

      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to update cart item quantity',
        itemId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  // Remove Item
  async removeItem(itemsId: string) {
    try {
      const result = await this.cartRepo.deleteCartItem(itemsId);
      this.logger.info({
        level: 'info',
        message: 'Cart item removed',
        itemId: itemsId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to remove cart item',
        itemId: itemsId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  // Clear Cart
  async clearCart(cartId: string) {
    try {
      const result = await this.cartRepo.deleteCartItems(cartId);
      this.logger.info({
        level: 'info',
        message: 'Cart cleared',
        cartId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to clear cart',
        cartId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  // Get Full Cart (with relations)
  async getCart(userId?: string, sessionId?: string) {
    const result = await this.cartRepo.findCartWithItems(userId, sessionId);
    this.logger.info({
      level: 'info',
      message: 'Cart retrieved',
      userId: userId || 'guest',
      itemCount: result?.items?.length || 0,
      status: 'success',
    });
    return result;
  }

  // Merge Guest Cart → User Cart
  async mergeCart(userId: string, sessionId: string) {
    try {
      const guestCart = await this.cartRepo.findCartBySession(sessionId);

      if (!guestCart) return null;

      const { cart: userCart } = await this.getOrCreateCart(userId);

      for (const item of guestCart.items) {
        await this.cartRepo.upsertCartItem({
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          increment: true,
        });
      }

      await this.cartRepo.deleteCart(guestCart.id);

      this.logger.info({
        level: 'info',
        message: 'Cart merged successfully',
        userId,
        guestCartId: guestCart.id,
        userCartId: userCart.id,
        itemCount: guestCart.items.length,
        status: 'success',
      });

      return userCart;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to merge cart',
        userId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  // Get Cart Totals
  async getCartTotals(userId?: string, sessionId?: string) {
    const cart = await this.getCart(userId, sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        itemCount: 0,
        subtotal: 0,
        total: 0,
      };
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * Number(item.price)), 0);

    // For now, assuming no tax or shipping - extend as needed
    const total = subtotal;

    return {
      itemCount,
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  // Cleanup Expired Carts (for cron)
  async cleanupExpiredCarts() {
    return this.cartRepo.deleteExpiredCarts();
  }
}
