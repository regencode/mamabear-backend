import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { CursorPaginationService } from '@/common/services/pagination.service';

@Module({
  providers: [ReviewsService, ReviewsRepository, CursorPaginationService],
  exports: [ReviewsService, ReviewsRepository, CursorPaginationService],
})
export class ReviewsModule {}
