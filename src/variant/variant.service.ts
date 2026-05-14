import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantRepository } from './variant.repository';
import { ProductsRepository } from '@/products/products.repository';
import slugify from 'slugify';

@Injectable()
export class VariantService {
  constructor(
      private readonly repo: VariantRepository,
  ) {}

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
      throw new BadRequestException('Variant not found');
    }

    const product = await this.repo.findProductById(variant.productId);

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    if (dto.name) {
      const newSku = this.generateSku(product.slug, dto.name);
      dto.sku = newSku;
    }

    await this.repo.update(variantId, dto);

    return {
      success: true,
      message: 'Variant updated successfully',
    };
  }

  async createVariant(userId: number, dto: CreateVariantDto) {
    if (!dto.productId) {
      throw new BadRequestException('Product Id must be set!');
    }
    const product = await this.repo.findProductById(dto.productId);

    if (!product) {
      throw new BadRequestException('Product not found');
    }
    if (!dto.sku) {
      const newSku = this.generateSku(product.slug, dto.name);
      dto.sku = newSku;
    }

    await this.repo.createProductVariant(dto);

    return {
      success: true,
      message: 'Variant created successfully',
    };
  }

  getProductVariant(productId: number) {
    return this.repo.findProductVariantsByProductId(productId);
  }

  async getProductVariantBySlug(productSlug: string) {
    const resolvedProduct = await this.repo.findProductBySlug(productSlug);
    if(!resolvedProduct) {
        return new NotFoundException(`Cannot find product with slug ${productSlug}`);
    }
    return this.repo.findProductById(resolvedProduct.id);
  }

  async deleteVariant(userId: number, variantId: number) {
    const variant = await this.repo.findOne(variantId);
    if (!variant) throw new BadRequestException('variant not found');
    await this.repo.delete({ id: variantId });
    return {
      success: true,
      message: `Variant ${variant.sku} deleted successfully`,
    };
  }
}
