import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductImageCreateInput) {
    return this.prisma.productImage.create({
      data,
    });
  }

  createMany(data: Prisma.ProductImageCreateManyInput[]) {
    return this.prisma.productImage.createMany({
      data,
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
