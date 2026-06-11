import { OrderService } from './order.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CancelOrderDto } from './dto/cancel-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@Controller('admin/order')
export class OrderAdminController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll() //Should have the pagination params here
  {
    return this.orderService.findAll();
  }

  @Post(':id/cancel')
  cancelOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(req.user.sub, id, dto.reason);
  }

  @Patch(':id/status')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.updateOrderStatus(
      req.user.sub,
      id,
      updateOrderDto,
    );
  }

  @Patch(':id/tracking')
  updateTrackingNumber(
    @Param('id') id: string,
    @Body() updateTrackingDto: UpdateTrackingDto,
  ) {
    return this.orderService.updateTrackingNumber(id, updateTrackingDto);
  }

  @Get(':id/invoice')
  getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.orderService.getInvoice(req.user.sub, req.user.role, id);
  }
}
