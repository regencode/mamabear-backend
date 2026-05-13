import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ProductsController } from './products.controller';
import { ReviewsModule } from '@/reviews/reviews.module';
import { DiscountsModule } from '@/discounts/discounts.module';
import { VariantModule } from '@/variant/variant.module';

@Module({
  imports: [ReviewsModule, DiscountsModule, VariantModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository]
})
export class ProductsModule {}
