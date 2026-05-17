import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart-dto';
import { CartRepository } from './cart.repository';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly prisma: PrismaService,
  ) {}

  // Get or Create Cart
  async getOrCreateCart(userId?: string, sessionId?: string) {
    let cart: Awaited<ReturnType<typeof this.cartRepo.findCartByUser>> = null;

    if (userId) {
      cart = await this.cartRepo.findCartByUser(userId);
    }

    if (!cart && sessionId) {
      cart = await this.cartRepo.findCartBySession(sessionId);
    }

    if (cart) return cart;

    const data: {
      userId?: string | null;
      sessionId?: string | null;
      expiresAt?: Date;
    } = {};

    if (userId) data.userId = userId;
    if (sessionId) {
      data.sessionId = sessionId;
      data.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    return this.cartRepo.createCart(data);
  }

   // Add Item to Cart
async addToCart(dto: AddToCartDto, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

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

    return this.cartRepo.upsertCartItem({
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      quantity: requestedQuantity,
      price: variant.priceIdr,
      increment: true,
    });
  }

// Update Quantity
async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const cartItem = await this.cartRepo.findCartItemById(id);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.variant && quantity > cartItem.variant.stock) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${cartItem.variant.stock}, Requested: ${quantity}`
      );
    }

    return this.cartRepo.updateCartItemQuantity(itemId, quantity);
  }

  // Remove Item
  async removeItem(itemsId: string) {
    return this.cartRepo.deleteCartItem(itemsId);
  }

  // Clear Cart
  async clearCart(cartId: string) {
    return this.cartRepo.deleteCartItems(cartId);
  }

  // Get Full Cart (with relations)
  async getCart(userId?: string, sessionId?: string) {
    return this.cartRepo.findCartWithItems(userId, sessionId);
  }

  // Merge Guest Cart → User Cart
  async mergeCart(userId: string, sessionId: string) {
    const guestCart = await this.cartRepo.findCartBySession(sessionId);

    if (!guestCart) return null;

    const userCart = await this.getOrCreateCart(userId);

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

    return userCart;
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
