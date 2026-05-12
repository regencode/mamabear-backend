import { Product } from './../products/entities/product.entity';
import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductById(productId: number) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  findOne(variantId: number) {
    return this.prisma.productVariant.findUnique({ where: { id: variantId } });
  }

  update(
    where: Prisma.ProductVariantWhereUniqueInput,
    data: Prisma.ProductVariantUpdateInput,
  ) {
    return this.prisma.productVariant.update({ where, data });
  }

  delete(where: Prisma.ProductVariantWhereUniqueInput) {
    return this.prisma.productVariant.delete({ where });
  }
}
