import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  update(
    where: Prisma.CategoryWhereUniqueInput,
    data: Prisma.CategoryUpdateInput,
  ) {
    return this.prisma.category.update({ where, data });
  }

  delete(where: Prisma.CategoryWhereUniqueInput) {
    return this.prisma.category.delete({ where });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug }, include: { products: true } });
  }

  findById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }
}
