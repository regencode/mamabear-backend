import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart-dto';


@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Get Cart
  @Get()
  async getCart(@Req() req: any) {
    const userId = req.user?.id; // from auth (if logged in)
    const sessionId = req.cookies?.sessionId;

    return this.cartService.getCart(userId, sessionId);
  }
  
  // Get Cart Totals
  @Get('totals')
  async getCartTotals(@Req() req: any) {
    const userId = req.user?.id; // from auth (if logged in)
    const sessionId = req.cookies?.sessionId;

    return this.cartService.getCartTotals(userId, sessionId);
  }

  // Merge Guest Cart → User Cart (for internal use)
  @Post('merge')
  async mergeCart(@Req() req: any) {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;

    return this.cartService.mergeCart(userId, sessionId);
  }

  // Add to Cart
  @Post('items')
  async addToCart(@Body() dto: AddToCartDto, @Req() req: any) {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;

    return this.cartService.addToCart(dto, userId, sessionId);
  }

  // Update Quantity
  @Patch('/items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(itemId, quantity);
  }

  // Remove Item
  @Delete('/items/:itemId')
  async removeItem(@Param('itemId') itemId: string) {
    return this.cartService.removeItem(itemId);
  }
   
  // Clear Cart
  @Delete()
  async clearCart(@Req() req: any) {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;

    const cart = await this.cartService.getOrCreateCart(userId, sessionId);
    return this.cartService.clearCart(cart.id);
  }
  
}
