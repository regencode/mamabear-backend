import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { CursorPaginationService } from '@/common/services/pagination.service';
import { ShippingModule } from '@/shipping/shipping.module';

@Module({
  imports: [ShippingModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    CursorPaginationService,
  ],
  exports: [OrderRepository],
})
export class OrderModule {}
