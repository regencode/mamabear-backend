import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';
import slugify from 'slugify';
import { CreateProductVariantDto } from './dto/create-productVariant.dto';
import { CreateVariantCombinationDto } from './dto/create-variantCombination';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProductsService.name);
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const result = await this.productsRepository.create(createProductDto);
      this.logger.info({
        level: 'info',
        message: 'Product created successfully',
        endpoint: 'POST /products',
        productId: result.id,
        name: createProductDto.name,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Product creation failed',
        endpoint: 'POST /products',
        name: createProductDto.name,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findAll() {
    try {
      const result = await this.productsRepository.findAll();
      this.logger.info({
        level: 'info',
        message: 'Retrieved all products',
        endpoint: 'GET /products',
        count: result.length,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve products',
        endpoint: 'GET /products',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.productsRepository.findById(id);
      if (!product) {
        this.logger.warn({
          level: 'warn',
          message: 'Product not found',
          endpoint: 'GET /products/:id',
          productId: id,
          status: 'failure',
        });
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      this.logger.info({
        level: 'info',
        message: 'Retrieved product by id',
        endpoint: 'GET /products/:id',
        productId: id,
        status: 'success',
      });
      return product;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve product',
        endpoint: 'GET /products/:id',
        productId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const result = await this.productsRepository.update(id, updateProductDto);
      this.logger.info({
        level: 'info',
        message: 'Product updated successfully',
        endpoint: 'PUT /products/:id',
        productId: id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Product update failed',
        endpoint: 'PUT /products/:id',
        productId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const result = await this.productsRepository.delete(id);
      this.logger.info({
        level: 'info',
        message: 'Product deleted successfully',
        endpoint: 'DELETE /products/:id',
        productId: id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Product deletion failed',
        endpoint: 'DELETE /products/:id',
        productId: id,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async createVariant(
    userId: number,
    productId: number,
    dto: CreateProductVariantDto,
  ) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new BadRequestException('Product not found');
    }
    const newSku = this.generateSku(product.slug, dto.variantValue);

    await this.productsRepository.createProductVariant({
      product: {
        connect: {
          id: product.id,
        },
      },
      variantType: dto.variantType,
      variantValue: dto.variantValue,
      sku: newSku,
      priceAdjustment: dto.priceAdjustment,
      stock: dto.stock,
    });

    return {
      success: true,
      message: 'Variant created successfully',
    };
  }

  getProductVariant(productId: number) {
    return this.productsRepository.findProductVariantsByProductId(productId);
  }

  getAllVariantCombinations(productId: number) {
    return this.productsRepository.findAllVariantCombinations(productId);
  }

  async createVariantCombinations(
    userId: number,
    productId: number,
    dto: CreateVariantCombinationDto,
  ) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const variants =
      await this.productsRepository.findProductVariantsByProductId(productId);

    if (!variants) {
      throw new BadRequestException('Variant not found');
    }

    const allowedVariants = variants.map(
      (variant) => `${variant.variantType}:${variant.variantValue}`,
    );

    for (const item of dto.combinations) {
      for (const [type, value] of Object.entries(item.combination)) {
        const key = `${type}:${value}`;

        if (!allowedVariants.includes(key)) {
          throw new BadRequestException(
            `Invalid variant combination: ${type} = ${value}`,
          );
        }
      }
    }

    const data = dto.combinations.map((item) => {
      return {
        productId: product.id,
        combination: item.combination,
        sku:
          item.sku ??
          this.generateCombinationSku(product.slug, item.combination),
        price: item.price,
        stock: item.stock,
      };
    });
    await this.productsRepository.createProductVariantCombination(data);

    return {
      success: true,
      message: 'Variant combinations created successfully',
    };
  }

  private generateSku(productSlug: string, variantValue: string): string {
    const base = `${productSlug}-${variantValue}`;
    return slugify(base, {
      lower: false,
      strict: true,
    }).toUpperCase();
  }

  private generateCombinationSku(
    productSlug: string,
    combination: Record<string, string>,
  ): string {
    const values = Object.values(combination);

    return slugify(`${productSlug}-${values.join('-')}`, {
      strict: true,
      lower: false,
      trim: true,
    }).toUpperCase();
  }
}
