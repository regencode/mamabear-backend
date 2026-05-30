import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MidtransService } from '@/midtrans/midtrans.service';

@Module({
  imports: [MidtransService],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
