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
@UseGuards(new JwtAuthGuard())
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.sub, createOrderDto);
  }

  @Post(':id/cancel')
  cancelOrder(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(req.user.sub, id, dto.reason);
  }

  @Roles([Role.ADMIN])
  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.updateOrderStatus(
      req.user.sub,
      id,
      updateOrderDto,
    );
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.orderService.getOrderById(req.user.sub, id);
  }

  @Get()
  findAll(@Req() req, @Query() paginationDto: OrderPaginationDto) {
    return this.orderService.getOrdersByUserId(req.user.sub, paginationDto);
  }

  @Get(':id/invoice')
  getInvoice(@Req() req, @Param('id') id: string) {
    return this.orderService.getInvoice(req.user.sub, id);
  }
}
