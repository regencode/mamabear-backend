import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class VariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductById(productId: number) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  findOne(variantId: number) {
    return this.prisma.productVariant.findUnique({ where: { id: variantId } });
  }

  update(variantId: number, dto: UpdateVariantDto) {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: dto.name,
        priceIdr: dto.priceIdr,
        weightG: dto.weightG,
        sku: dto.sku,
        stock: dto.stock,
        images: dto.images?.length
          ? {
              create: dto.images.map((image) => ({
                imageUrl: image.imageUrl,
                publicId: image.publicId,
                width: image.width,
                height: image.height,
                fileSize: image.fileSize,
                format: image.format,
                altText: image.altText,
                sortOrder: image.sortOrder,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });
  }

  delete(where: Prisma.ProductVariantWhereUniqueInput) {
    return this.prisma.productVariant.delete({ where });
  }

  createProductVariant(dto: CreateVariantDto) {
    return this.prisma.productVariant.create({
      data: {
        name: dto.name,
        priceIdr: dto.priceIdr,
        weightG: dto.weightG,
        sku: dto.sku,
        stock: dto.stock,
        product: { connect: { id: dto.productId } },
        images: dto.images?.length
          ? {
              create: dto.images.map((image) => ({
                imageUrl: image.imageUrl,
                publicId: image.publicId,
                width: image.width,
                height: image.height,
                fileSize: image.fileSize,
                format: image.format,
                altText: image.altText,
                sortOrder: image.sortOrder,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });
  }

  findProductVariantsByProductId(productId: number) {
    return this.prisma.productVariant.findMany({
      where: { productId: productId },
      include: {
        images: true,
      },
    });
  }

  findProductBySlug(productSlug: string) {
    return this.prisma.product.findUnique({ where: { slug: productSlug } });
  }
}
