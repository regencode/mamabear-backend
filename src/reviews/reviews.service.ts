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
    private readonly productsRepository: ProductsRepository,
    private readonly reviewsRepository: ReviewsRepository,
    private readonly paginationService: CursorPaginationService,
  ) {}

  /**
   * ✅ Cursor pagination tetap nested di product
   */
  async findReviewsOfProduct(
    productId: number,
    paginationDto: CursorPaginationRequestDto,
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
    paginationDto: CursorPaginationRequestDto,
  ) {
    const resolvedProduct = await this.productsRepository.findBySlug(productSlug);
    if(!resolvedProduct) return new NotFoundException(`Cannot find product with slug ${productSlug}`);
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
    const resolvedProduct = await this.productsRepository.findBySlug(slug);  
    if(!resolvedProduct) return new NotFoundException(`Cannot find product with slug ${slug}`);
    dto.productId = resolvedProduct.id;
    return this.reviewsRepository.create(dto)
  }

  async upvoteReviewWithId(id: number) {
    return this.reviewsRepository.upvoteReviewWithId(id)
  }

  async remove(id: number) {
    return this.reviewsRepository.remove(id)
  }
}
