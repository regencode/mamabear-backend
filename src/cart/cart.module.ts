import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';

@Module({
  providers: [CartService, PrismaService, CartRepository],
  exports: [CartService],
  controllers: [CartController],
})
export class CartModule {}
