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

    return result;
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    const category = await this.repo.findBySlug(generatedSlug);
    if (category) throw new BadRequestException('Category already exists');

    await this.repo.create({
      name: dto.name,
      slug: generatedSlug,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });

    return {
      success: true,
      message: `Category ${dto.name} created successfully`,
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
    const category = await this.repo.findById(categoryId);

    if (!category) throw new BadRequestException('Category not found');

    if (dto.name) {
      const generatedSlug = slugify(dto.name, { lower: true, strict: true });
      const category = await this.repo.findBySlug(generatedSlug);
      if (category) throw new BadRequestException('Category already exists');
      dto.slug = generatedSlug;
    }

    await this.repo.update({ id: categoryId }, dto);

    return {
      success: true,
      message: `Category ${category.name} updated successfully`,
    };
  }

  async deleteCategory(userId: string, categoryId: number) {
    const category = await this.repo.findById(categoryId);
    if (!category) throw new BadRequestException('Category not found');
    if (category.products.length > 0)
      throw new BadRequestException('Category has products');
    await this.repo.delete({ id: categoryId });

    return {
      success: true,
      message: `${category.name} deleted successfully`,
    };
  }
}
