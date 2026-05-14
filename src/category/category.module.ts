import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryAdminController } from './category-admin.controller';
import { CategoryRepository } from './category.repository';

@Module({
  controllers: [CategoryController, CategoryAdminController],
  providers: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
