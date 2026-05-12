import { Injectable } from '@nestjs/common'
import { ReviewsRepository } from './reviews.repository'
import { CreateReviewDto } from './dto/create-review.dto'
import { Review } from './entities/review.entity'
import { CursorPaginationService } from '@/common/services/pagination.service'
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto'

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
    productId: string,
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

  async createReviewForProduct(dto: CreateReviewDto) {
    return this.reviewsRepository.create(dto)
  }

  async upvoteReviewWithId(id: string) {
    return this.reviewsRepository.upvoteReviewWithId(id)
  }

  async remove(id: string) {
    return this.reviewsRepository.remove(id)
  }
}
