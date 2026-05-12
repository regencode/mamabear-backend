import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantRepository } from './variant.repository';
import slugify from 'slugify';

@Injectable()
export class VariantService {
  constructor(private readonly repo: VariantRepository) {}

  private generateSku(productSlug: string, variantValue: string): string {
    const base = `${productSlug}-${variantValue}`;
    return slugify(base, {
      lower: false,
      strict: true,
    }).toUpperCase();
  }

  async updateVariant(
    userId: number,
    variantId: number,
    dto: UpdateVariantDto,
  ) {
    const variant = await this.repo.findOne(variantId);

    if (!variant) {
      throw new BadRequestException('variant not found');
    }

    const product = await this.repo.findProductById(variant.productId);

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    if (dto.variantValue) {
      const newSku = this.generateSku(product.slug, dto.variantValue);
      dto.sku = newSku;
    }

    await this.repo.update({ id: variantId }, dto);

    return {
      success: true,
      message: 'Variant updated successfully',
    };
  }

  async deleteVariant(userId: number, variantId: number) {
    const variant = await this.repo.findOne(variantId);
    if (!variant) throw new BadRequestException('variant not found');
    await this.repo.delete({ id: variantId });
    return {
      success: true,
      message: `Variant ${variant.variantValue} deleted successfully`,
    };
  }
}
