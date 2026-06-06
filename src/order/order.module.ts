import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderAdminController } from './order-admin.controller';
import { OrderRepository } from './order.repository';

@Module({
  controllers: [OrderController, OrderAdminController],
  providers: [OrderService, OrderRepository],
  exports: [OrderRepository],
})
export class OrderModule {}
