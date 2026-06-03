import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CartService, CartRepository],
  exports: [CartService, CartRepository],
  controllers: [CartController],
})
export class CartModule {}
