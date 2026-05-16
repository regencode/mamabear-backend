import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ProductsController } from './products.controller';
import { ProductsAdminController } from './products-admin.controller';
import { ReviewsModule } from '@/reviews/reviews.module';
import { DiscountsModule } from '@/discounts/discounts.module';
import { VariantModule } from '@/variant/variant.module';
import { SearchModule } from '@/search/search.module';

@Module({
  imports: [ReviewsModule, DiscountsModule, VariantModule, SearchModule],
  controllers: [ProductsController, ProductsAdminController],
  providers: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
