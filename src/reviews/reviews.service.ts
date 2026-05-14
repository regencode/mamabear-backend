import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { CursorPaginationService } from '@/common/services/pagination.service';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CursorPaginationResponseDto } from '@/common/dto/response/pagination.response.dto';
import { ServiceResult } from '@/common/ServiceResult';
import { Review } from '@/generated/prisma';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly paginationService: CursorPaginationService,
  ) {}

  async findReviewsOfProduct(
    productId: number,
    paginationDto?: CursorPaginationRequestDto,
  ): Promise<ServiceResult<CursorPaginationResponseDto<Review>>> {
    const result = await this.paginationService.paginate<Review>(
      this.reviewsRepository,
      paginationDto,
      {
        where: { productId },
      },
      {
        cursorField: 'id',
        orderDirection: 'asc',
      },
    );
    return {
      success: true,
      message: `Found ${result.data.length} reviews`,
      data: result,
    };
  }

  async findReviewsOfProductBySlug(
    productSlug: string,
    paginationDto?: CursorPaginationRequestDto,
  ): Promise<ServiceResult<CursorPaginationResponseDto<Review>>> {
    const resolvedProduct = await this.reviewsRepository.findProductBySlug(productSlug);
    if (!resolvedProduct) throw new NotFoundException(`Cannot find product with slug ${productSlug}`);
    const result = await this.paginationService.paginate<Review>(
      this.reviewsRepository,
      paginationDto,
      {
        where: { productId: resolvedProduct.id },
      },
      {
        cursorField: 'id',
        orderDirection: 'asc',
      },
    );
    return {
      success: true,
      message: `Found ${result.data.length} reviews for product ${productSlug}`,
      data: result,
    };
  }

  async createReviewForProduct(dto: CreateReviewDto): Promise<ServiceResult<Review>> {
    const result = await this.reviewsRepository.create(dto);
    return {
      success: true,
      message: 'Review created successfully',
      data: result,
    };
  }

  async createReviewForProductWithSlug(slug: string, dto: CreateReviewDto): Promise<ServiceResult<Review>> {
    const resolvedProduct = await this.reviewsRepository.findProductBySlug(slug);
    if (!resolvedProduct) throw new NotFoundException(`Cannot find product with slug ${slug}`);
    dto.productId = resolvedProduct.id;
    const result = await this.reviewsRepository.create(dto);
    return {
      success: true,
      message: 'Review created successfully',
      data: result,
    };
  }

  async upvoteReviewWithId(id: number): Promise<ServiceResult<Review>> {
    const result = await this.reviewsRepository.upvoteReviewWithId(id);
    return {
      success: true,
      message: `Review ${id} upvoted successfully`,
      data: result,
    };
  }

  async remove(id: number): Promise<ServiceResult<Review>> {
    const result = await this.reviewsRepository.remove(id);
    return {
      success: true,
      message: `Review ${id} deleted successfully`,
      data: result,
    };
  }
}
