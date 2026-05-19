import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart-dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { dot } from 'node:test/reporters';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';


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
  // @(UseGuards(new JwtAuthGuard()))
  @Post('merge')
  async mergeCart(@Req() req: any) {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;

    return this.cartService.mergeCart(userId, sessionId);
  }

  // Add to Cart
  // @(UseGuards(new JwtAuthGuard()))
  @Post('items')
  async addToCart(@Body() dto: AddToCartDto, @Req() req: any) {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;

    return this.cartService.addToCart(dto, userId, sessionId);
  }

  // Update Quantity
  // @(UseGuards(new JwtAuthGuard()))
  @Patch('/items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(itemId, dto.quantity);
  }

  // Remove Item
  // @(UseGuards(new JwtAuthGuard()))
  @Delete('/items/:itemId')
  async removeItem(@Param('itemId') itemId: string) {
    return this.cartService.removeItem(itemId);
  }
   
  // Clear Cart
  @Delete()
  // @(UseGuards(new JwtAuthGuard()))
  async clearCart(@Req() req: any) {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;

    const cart = await this.cartService.getOrCreateCart(userId, sessionId);
    return this.cartService.clearCart(cart.id);
  }
  
}
