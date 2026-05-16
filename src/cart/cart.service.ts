import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

     return this.prisma.cartItem.upsert({
       where: {
         cartId_productId_variantId: {
           cartId: cart.id,
           productId: variant.productId,
           variantId: variant.id,
         },
       },
       update: {
         quantity: {
           increment: requestedQuantity,
         },
       },
       create: {
         cartId: cart.id,
         productId: variant.productId,
         variantId: variant.id,
         quantity: requestedQuantity,
         price: variant.priceIdr,
       },
     });
   }

   // Update Quantity
   async updateItemQuantity(itemId: string, quantity: number) {
     if (quantity <= 0) {
       return this.removeItem(itemId);
     }

     // Get cart item with variant to check stock
     const cartItem = await this.prisma.cartItem.findUnique({
       where: { id: itemId },
       include: { variant: true },
     });

     if (!cartItem) {
       throw new NotFoundException('Cart item not found');
     }

     // Check stock availability
     if (quantity > cartItem.variant.stock) {
       throw new BadRequestException(
         `Insufficient stock. Available: ${cartItem.variant.stock}, Requested: ${quantity}`
       );
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

   // Get Cart Totals
   async getCartTotals(userId?: string, sessionId?: string) {
     const cart = await this.getOrCreateCart(userId, sessionId);
     
     if (!cart || !cart.items || cart.items.length === 0) {
       return {
         itemCount: 0,
         subtotal: 0,
         total: 0,
       };
     }

     const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
     const subtotal = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
     
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
    return this.prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
