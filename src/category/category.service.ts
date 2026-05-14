import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './category.repository';
import slugify from 'slugify';

@Injectable()
export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  async getAllCategory() {
    const result = this.repo.findAll();

    if (result === null) {
      return [];
    }

    return result;
  }

  getCategoryBySlug(slug: string) {
    const result = this.repo.findBySlug(slug);

    if (result === null) {
      return null;
    }
    return {
      success: true,
      message: `Category with slug ${slug} found`,
      data: result,
    };
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    const resolvedCategory = await this.repo.findBySlug(generatedSlug);
    if (resolvedCategory) throw new BadRequestException('Category already exists');

    const result = await this.repo.create({
      name: dto.name,
      slug: generatedSlug,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });

    return {
      success: true,
      message: `Category ${dto.name} created successfully`,
      data: result,
    };
  }

  async getProductByCategory(slug: string) {
    return this.repo.findProductByCategory(slug);
  }

  async updateCategory(
    userId: string,
    categoryId: number,
    dto: UpdateCategoryDto,
  ) {
    const resolvedCategory = await this.repo.findById(categoryId);

    if (!resolvedCategory) throw new BadRequestException('Category not found');

    if (dto.name) {
      const generatedSlug = slugify(dto.name, { lower: true, strict: true });
      const category = await this.repo.findBySlug(generatedSlug);
      if (category) throw new BadRequestException('Name update generates a slug that already exists');
      dto.slug = generatedSlug;
    }

    const category = await this.repo.update({ id: categoryId }, dto);

    return {
      success: true,
      message: `Category ${category.name} updated successfully`,
      data: category,
    };
  }

  async deleteCategory(userId: string, categoryId: number) {
    const category = await this.repo.findById(categoryId);
    if (!category) throw new BadRequestException('Category not found');
    if (category.products.length > 0)
      throw new BadRequestException('Category has products');
    const deletedCategory = await this.repo.delete({ id: categoryId });

    return {
      success: true,
      message: `${category.name} deleted successfully`,
      data: deletedCategory,
    };
  }
}
