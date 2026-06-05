import { OrderService } from "./order.service";
import { Post, Req, Param, Body, Patch } from "@nestjs/common";
import { CancelOrderDto } from "./dto/cancel-order-item.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

export class OrderAdminController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':id/cancel')
  cancelOrder(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(req.user.sub, id, dto.reason);
  }

  @Patch(':id/status')
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

}
