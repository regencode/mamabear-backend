import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

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
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  findById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }

  findProductByCategory(slug: string) {
    return this.prisma.category.findUnique({
      where: {
        slug,
      },
      select: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            variants: true,
            category: {
              select: {
                name: true,
              },
            },
            images: {
              select: {
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
