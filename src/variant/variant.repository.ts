import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { syncImages } from '@/common/utils/image.util';

const VARIANT_INCLUDE = {
  images: true,
  discount: true,
};

@Injectable()
export class VariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductById(productId: number) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  findOne(variantId: number) {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: VARIANT_INCLUDE,
    });
  }

  update(variantId: number, dto: UpdateVariantDto) {
    const { images, ...variantData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
        where: { id: variantId },
        data: variantData,
        include: { images: true },
      });
      let syncedImages = variant.images;
      if (images !== undefined) {
        syncedImages = await syncImages(tx, 'variantId', variantId, images);
      }
      return { ...variant, images: syncedImages };
    });
  }

  delete(where: Prisma.ProductVariantWhereUniqueInput) {
    return this.prisma.productVariant.delete({ where });
  }

  createProductVariant(productId: number, dto: CreateVariantDto) {
    return this.prisma.productVariant.create({
      data: {
        name: dto.name,
        priceIdr: dto.priceIdr,
        weightG: dto.weightG,
        sku: dto.sku,
        stock: dto.stock,
        sortOrder: dto.sortOrder,
        product: { connect: { id: productId } },
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
      include: VARIANT_INCLUDE,
    });
  }

  findProductVariantsByProductId(productId: number) {
    return this.prisma.productVariant.findMany({
      where: { productId: productId },
      include: VARIANT_INCLUDE,
    });
  }

  findProductBySlug(productSlug: string) {
    return this.prisma.product.findUnique({
      where: { slug: productSlug },
      include: { variants: { include: VARIANT_INCLUDE } },
    });
  }
}
