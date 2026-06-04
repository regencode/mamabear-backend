import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { PinoLogger } from 'pino-nestjs';

@Controller('payment')
export class PaymentController {
  constructor(
      private readonly paymentService: PaymentService,
      private readonly logger: PinoLogger,
  ) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('create')
  createTransaction(@Body() dto: CreateTransactionDto) {
      return this.paymentService.createTransaction(dto);
  }
  @Post('notification')
  handleNotification(notification: any) {
      this.logger.info({
          message: "Processing inbound notification",
          inboundNotification: notification,
      }) 
      const handler = this.paymentService.resolveNotificationType(notification.payment_type as string);
      return handler(notification);
  }
}
