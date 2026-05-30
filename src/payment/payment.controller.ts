import { Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('create')
  createTransaction(dto: CreateTransactionDto) {
      return this.paymentService.createTransaction(dto);
  }
  @Post('notification')
  handleNotification(notification: any) {
      const handler = this.paymentService.resolveNotificationType(notification.payment_type as string);
      return handler(notification);
  }
}
