import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { CursorPaginationService } from '@/common/services/pagination.service';

@Module({
  imports: [],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, CursorPaginationService],
})
export class OrderModule {}
