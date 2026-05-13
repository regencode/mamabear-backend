import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { HighlightsRepository } from './highlights.repository';
import slugify from 'slugify';

@Injectable()
export class HighlightsService {
  constructor(private readonly repo: HighlightsRepository) {}

  async create(dto: CreateHighlightDto) {
    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    const existing = await this.repo.findBySlug(generatedSlug);
    if (existing) throw new BadRequestException('Highlight already exists');

    const result = await this.repo.create({
      name: dto.name,
      slug: generatedSlug,
      description: dto.description,
      isActive: dto.isActive,
    });

    return result;
  }

  async findAll() {
    const result = await this.repo.findAll();
    if (result === null) return [];
    return result;
  }

  async findOne(id: number) {
    const highlight = await this.repo.findById(id);
    if (!highlight) throw new BadRequestException('Highlight not found');
    return highlight;
  }

  async update(id: number, dto: UpdateHighlightDto) {
    const highlight = await this.repo.findById(id);
    if (!highlight) throw new BadRequestException('Highlight not found');

    if (dto.name) {
      const generatedSlug = slugify(dto.name, { lower: true, strict: true });
      const existing = await this.repo.findBySlug(generatedSlug);
      if (existing) throw new BadRequestException('Highlight already exists');
      dto.slug = generatedSlug;
    }

    const result = await this.repo.update({ id }, dto);

    return result;
  }

  async remove(id: number) {
    const highlight = await this.repo.findById(id);
    if (!highlight) throw new BadRequestException('Highlight not found');
    if (highlight.products.length > 0)
      throw new BadRequestException('Highlight has products');

    await this.repo.delete({ id });

    return {
      success: true,
      message: `${highlight.name} deleted successfully`,
    };
  }
}
