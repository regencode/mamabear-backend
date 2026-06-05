import {
  Injectable,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderRepository } from './order.repository';
import { CursorPaginationService } from '@/common/services/pagination.service';
import { ShippingService } from '@/shipping/shipping.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly paginationService: CursorPaginationService,
    private readonly shippingService: ShippingService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto)
}
