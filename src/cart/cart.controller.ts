import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
  Param,
  Inject,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart-dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { PinoLogger } from 'pino-nestjs';

@ApiTags('cart')
@ApiBearerAuth('JwtAuthGuard')
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CartController.name);
  }

  @Get()
  async getCart(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    try {
      const userId = req.user?.sub;
      const sessionId = req.cookies?.sessionId;
      let result = await this.cartService.getCart(userId, sessionId);

      if (!result && !userId && !sessionId) {
        const data = await this.cartService.getOrCreateCart(userId, sessionId);
        if (data.createdSessionId) {
          res.cookie('sessionId', data.createdSessionId, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
          });
        }
        result = data.cart;
      }
      this.logger.info({
        level: 'info',
        message: 'Cart retrieved successfully',
        endpoint: 'GET /cart',
        userId: userId || 'guest',
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve cart',
        endpoint: 'GET /cart',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @Get('totals')
  async getCartTotals(@Req() req: any) {
    try {
      const userId = req.user?.sub;
      const sessionId = req.cookies?.sessionId;

      const result = await this.cartService.getCartTotals(userId, sessionId);
      this.logger.info({
        level: 'info',
        message: 'Cart totals retrieved successfully',
        endpoint: 'GET /cart/totals',
        userId: userId || 'guest',
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve cart totals',
        endpoint: 'GET /cart/totals',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @Post('merge')
  async mergeCart(@Req() req: any) {
    try {
      const userId = req.user?.sub;
      const sessionId = req.cookies?.sessionId;

      if (!userId || !sessionId) {
        this.logger.warn({
          level: 'warn',
          message: 'Merge cart requires userId and sessionId',
          endpoint: 'POST /cart/merge',
          status: 'failure',
        });
        return { message: 'No session cart to merge' };
      }

      const result = await this.cartService.mergeCart(userId, sessionId);
      this.logger.info({
        level: 'info',
        message: 'Cart merged successfully',
        endpoint: 'POST /cart/merge',
        userId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to merge cart',
        endpoint: 'POST /cart/merge',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @Post('items')
  async addToCart(
    @Body() dto: AddToCartDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const userId = req.user?.sub;
      const sessionId = req.cookies?.sessionId;
      const { result, createdSessionId } = await this.cartService.addToCart(
        dto,
        userId,
        sessionId,
      );

      if (createdSessionId) {
        res.cookie('sessionId', createdSessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
        });
      }
      this.logger.info({
        level: 'info',
        message: 'Item added to cart successfully',
        endpoint: 'POST /cart/items',
        userId: userId || 'guest',
        variantId: dto.variantId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to add item to cart',
        endpoint: 'POST /cart/items',
        variantId: dto.variantId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @Patch('items/:id')
  async updateItem(
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    try {
      const result = await this.cartService.updateItemQuantity(
        itemId,
        dto.quantity,
      );
      this.logger.info({
        level: 'info',
        message: 'Cart item updated successfully',
        endpoint: 'PATCH /cart/items/:id',
        itemId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to update cart item',
        endpoint: 'PATCH /cart/items/:id',
        itemId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @Delete('items/:id')
  async removeItem(@Param('id') itemId: string) {
    try {
      const result = await this.cartService.removeItem(itemId);
      this.logger.info({
        level: 'info',
        message: 'Cart item removed successfully',
        endpoint: 'DELETE /cart/items/:id',
        itemId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to remove cart item',
        endpoint: 'DELETE /cart/items/:id',
        itemId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @Delete()
  async clearCart(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    try {
      const userId = req.user?.sub;
      const sessionId = req.cookies?.sessionId;
      const { cart, createdSessionId } = await this.cartService.getOrCreateCart(
        userId,
        sessionId,
      );

      if (createdSessionId) {
        res.cookie('sessionId', createdSessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
        });
      }

      const result = await this.cartService.clearCart(cart.id);

      this.logger.info({
        level: 'info',
        message: 'Cart cleared successfully',
        endpoint: 'DELETE /cart',
        cartId: cart.id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to clear cart',
        endpoint: 'DELETE /cart',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }
}