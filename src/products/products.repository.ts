import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_INCLUDE = {
  category: true,
  images: true,
  variants: true,
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductDto) {
    const { images, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        slug: '',
        ...(images?.length && {
          images: { create: images },
        }),
      },
      include: PRODUCT_INCLUDE,
    });
  }

  findAll() {
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
    const { images, ...productData } = data;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(images && {
          images: {
            deleteMany: {},
            create: images,
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

  findProductVariantsByProductId(productId: number) {
    return this.prisma.productVariant.findMany({ where: { productId } });
  }
}
