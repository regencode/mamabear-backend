import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductImageCreateInput) {
    return this.prisma.productImage.create({
      data: {
        imageUrl: data.imageUrl,
        altText: data.altText,
        publicId: data.publicId,
        sortOrder: data.sortOrder,
      },
    });
  }

  createMany(data: Prisma.ProductImageCreateManyInput[]) {
    return this.prisma.productImage.createMany({
      data: data.map((item) => ({
        imageUrl: item.imageUrl,
        altText: item.altText,
        publicId: item.publicId,
        sortOrder: item.sortOrder,
      })),
    });
  }

  delete(where: Prisma.ProductImageWhereUniqueInput) {
    return this.prisma.productImage.delete({ where });
  }

  findAll() {
    return this.prisma.productImage.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  findById(imageId: number) {
    return this.prisma.productImage.findUnique({ where: { id: imageId } });
  }
}
