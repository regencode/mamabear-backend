import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CartController } from './cart.controller';

@Module({
  providers: [CartService, PrismaService],
  exports: [CartService],
  controllers: [CartController],
})
export class CartModule {}
