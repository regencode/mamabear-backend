import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { CancelOrderDto } from './dto/cancel-order-item.dto';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';

@UseGuards(new JwtAuthGuard())
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.orderService.getOrderById(req.user.sub, id);
  }

  @Get()
  findAll(@Req() req: any, @Query() paginationDto: OrderPaginationDto) {
    return this.orderService.getOrdersByUserId(req.user.sub, paginationDto);
  }

  @Get(':id/invoice')
  getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.orderService.getInvoice(req.user.sub, id);
  }

  // refactor below
  @Post() // on checkout
  createOrderAfterCheckout(
    @GetUserId() userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto); // orderId as param for everything below
  }
}
