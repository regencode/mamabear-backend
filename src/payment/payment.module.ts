import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MidtransService } from './midtrans.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, MidtransService],
})
export class PaymentModule {}
