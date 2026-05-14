import { Injectable, NotFoundException } from '@nestjs/common'
import { ReviewsRepository } from './reviews.repository'
import { CreateReviewDto } from './dto/create-review.dto'
import { Review } from './entities/review.entity'
import { CursorPaginationService } from '@/common/services/pagination.service'
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto'
import { ProductsRepository } from '@/products/products.repository'

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly paginationService: CursorPaginationService,
  ) {}

  /**
   * ✅ Cursor pagination tetap nested di product
   */
  async findReviewsOfProduct(
    productId: number,
    paginationDto?: CursorPaginationRequestDto,
  ) {
    return this.paginationService.paginate<Review>(
      this.reviewsRepository,
      paginationDto,
      {
        where: { productId },
      },
      {
        cursorField: 'id',
        orderDirection: 'asc',
      },
    )
  }

  async findReviewsOfProductBySlug(
    productSlug: string,
    paginationDto?: CursorPaginationRequestDto,
  ) {
    const resolvedProduct = await this.reviewsRepository.findProductBySlug(productSlug);
    if(!resolvedProduct) throw new NotFoundException(`Cannot find product with slug ${productSlug}`);
    return this.paginationService.paginate<Review>(
      this.reviewsRepository,
      paginationDto,
      {
        where: { productId: resolvedProduct.id },
      },
      {
        cursorField: 'id',
        orderDirection: 'asc',
      },
    )
  }

  async createReviewForProduct(dto: CreateReviewDto) {
    return this.reviewsRepository.create(dto)
  }
  async createReviewForProductWithSlug(slug: string, dto: CreateReviewDto) {
    const resolvedProduct = await this.reviewsRepository.findProductBySlug(slug);  
    if(!resolvedProduct) throw new NotFoundException(`Cannot find product with slug ${slug}`);
    dto.productId = resolvedProduct.id;
    return this.reviewsRepository.createReviewForProduct(dto);
  }

  async upvoteReviewWithId(id: number) {
    return this.reviewsRepository.upvoteReviewWithId(id)
  }

  async remove(id: number) {
    return this.reviewsRepository.remove(id)
  }
}
