import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Review } from '@/generated/prisma';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsRepository {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    return this.prisma.review.create({
      data: {
        title: dto.title,
        rating: dto.rating,
        description: dto.description,
        imageUrls: dto.imageUrls,
        reviewer: { connect: { id: dto.reviewerId }},
        product: { connect: { id: dto.productId }}
      },
    });
  }

  async findProductBySlug(productSlug: string) {
      return this.prisma.product.findUnique({
          where: { slug: productSlug },
      });
  }

  async findByProductId(productId: number): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { productId },
    });
  }


  async upvoteReviewWithId(id: number): Promise<Review> {
      return this.prisma.review.update({
          where: { id },
          data: {
              numUpvotes: { increment: 1 },
          }
      });
  }


  async remove(id: number): Promise<Review> {
      return this.prisma.review.delete({
          where: { id },
      });
  }

  async findMany(args: any) {
      return this.prisma.review.findMany(args)
  }
}
