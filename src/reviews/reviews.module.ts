import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { CursorPaginationService } from '@/common/services/pagination.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository, CursorPaginationService],
  exports: [ReviewsService, ReviewsRepository, CursorPaginationService],
})
export class ReviewsModule {}
