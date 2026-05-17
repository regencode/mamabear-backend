import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantRepository } from './variant.repository';
import { ServiceResult } from '@/common/ServiceResult';
import { ProductVariant } from '@/generated/prisma';
import slugify from 'slugify';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';

@Injectable()
export class VariantService {
  constructor(
    private readonly repo: VariantRepository,
    private readonly cloudinary: CloudinaryService,
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
    files: Express.Multer.File[],
  ): Promise<ServiceResult<ProductVariant>> {
    const variant = await this.repo.findOne(variantId);
    if (!variant) throw new BadRequestException('Variant not found');

    const product = await this.repo.findProductById(variant.productId);
    if (!product) throw new BadRequestException('Product not found');

    if (dto.name) {
      const newSku = this.generateSku(product.slug, dto.name);
      dto.sku = newSku;
    }

    const images = files?.length
      ? await Promise.all(files.map((file) => this.cloudinary.uploadFile(file)))
      : [];

    const result = await this.repo.update(variantId, {
      ...dto,
      images: images.length
        ? images.map((image) => ({
            imageUrl: image.imageUrl,
            publicId: image.publicId,
            width: image.width,
            height: image.height,
            fileSize: image.fileSize,
            format: image.format,
            sortOrder: 0,
            altText: image.altText,
          }))
        : undefined,
    });

    return {
      success: true,
      message: 'Variant updated successfully',
      data: result,
    };
  }

  async createVariant(
    userId: number,
    dto: CreateVariantDto,
    files: Express.Multer.File[],
  ): Promise<ServiceResult<ProductVariant>> {
    if (!dto.productId) {
      throw new BadRequestException('Product Id must be set!');
    }

    const product = await this.repo.findProductById(dto.productId);
    if (!product) throw new BadRequestException('Product not found');

    if (!dto.sku) {
      const newSku = this.generateSku(product.slug, dto.name);
      dto.sku = newSku;
    }

    const images = await this.cloudinary.uploadMultiple(files);

    const result = await this.repo.createProductVariant({
      ...dto,
      images: images.map((image, index) => ({
        imageUrl: image.imageUrl,
        publicId: image.publicId,
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        format: image.format,
        altText: image.altText,
        sortOrder: index,
      })),
    });

    return {
      success: true,
      message: 'Variant created successfully',
      data: result,
    };
  }

  async getProductVariant(
    productId: number,
  ): Promise<ServiceResult<ProductVariant[]>> {
    const result = await this.repo.findProductVariantsByProductId(productId);
    return {
      success: true,
      message: `Found ${result.length} variants`,
      data: result,
    };
  }

  async getProductVariantBySlug(
    productSlug: string,
  ): Promise<ServiceResult<ProductVariant[]>> {
    const resolvedProduct = await this.repo.findProductBySlug(productSlug);

    if (!resolvedProduct) {
      throw new NotFoundException(
        `Cannot find product with slug ${productSlug}`,
      );
    }
    const result = await this.repo.findProductVariantsByProductId(
      resolvedProduct.id,
    );

    return {
      success: true,
      message: `Found ${result.length} variants for product ${productSlug}`,
      data: result,
    };
  }

  async deleteVariant(
    userId: number,
    variantId: number,
  ): Promise<ServiceResult<ProductVariant>> {
    const variant = await this.repo.findOne(variantId);
    if (!variant) throw new BadRequestException('variant not found');
    const deleted = await this.repo.delete({ id: variantId });
    return {
      success: true,
      message: `Variant ${variant.sku} deleted successfully`,
      data: deleted,
    };
  }
}
