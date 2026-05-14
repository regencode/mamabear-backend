import { Module } from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { HighlightsController } from './highlights.controller';
import { HighlightsRepository } from './highlights.repository';

@Module({
  controllers: [HighlightsController],
  providers: [HighlightsService, HighlightsRepository],
})
export class HighlightsModule {}
