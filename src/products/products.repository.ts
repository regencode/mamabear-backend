import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import slugify from 'slugify';

const PRODUCT_INCLUDE = {
  category: true,
  images: true,
  variants: true,
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const {
        images,
        variants,
        weightG,
        priceIdr,
        stock,
        sku,
        ...productData
      } = data;
      const product = await tx.product.create({
        data: productData,
        include: PRODUCT_INCLUDE,
      });
      if (variants?.length) {
        await tx.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId: product.id })),
        });
      }
      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map((img) => ({ ...img, productId: product.id })),
        });
      }
      return tx.product.findUnique({
        where: { id: product.id },
        include: PRODUCT_INCLUDE,
      });
    });
  }

  findMany() {
    return this.prisma.product.findMany({ include: PRODUCT_INCLUDE });
  }

  findById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });
  }

  update(id: number, data: UpdateProductDto) {
    const { images, variants, weightG, priceIdr, stock, sku, ...productData } =
      data;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(images?.length && {
          images: {
            createMany: {
              data: images.map((img) => ({
                imageUrl: img.imageUrl,
                sortOrder: img.sortOrder,
                altText: img.altText,
              })),
            },
          },
        }),
      },

      include: PRODUCT_INCLUDE,
    });
  }

  delete(id: number) {
    return this.prisma.product.delete({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  }
}
