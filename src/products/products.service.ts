import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CursorPaginationService } from '@/common/services/pagination.service';
import { CursorPaginationResponseDto } from '@/common/dto/response/pagination.response.dto';
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';
import { ServiceResult } from '@/common/ServiceResult';
import slugify from 'slugify';
import { Product } from '@/generated/prisma';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly logger: PinoLogger,
    private readonly paginationService: CursorPaginationService,
    private readonly cloudinary: CloudinaryService,
  ) {
    this.logger.setContext(ProductsService.name);
  }

  async create(
    dto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<ServiceResult<Product>> {
    try {
      if (!dto.variants) dto.variants = [];
      const defaultVariant: CreateVariantDto = {
        name: 'INTERNAL_DEFAULT',
        priceIdr: dto.priceIdr,
        weightG: dto.weightG,
        stock: dto.stock,
        sku: dto.sku,
        sortOrder: 0,
      };

      dto.variants.push(defaultVariant);
      const images = await this.cloudinary.uploadMultiple(files);

      const generatedSlug = slugify(dto.name, { lower: true, strict: true });

      const result = await this.productsRepository.create({
        ...dto,
        slug: generatedSlug,
        images: images.map((image) => ({
          imageUrl: image.imageUrl,
          publicId: image.publicId,
          width: image.width,
          height: image.height,
          fileSize: image.fileSize,
          format: image.format,
          sortOrder: 0,
          altText: image.altText,
        })),
      });

      if (!result) throw new BadRequestException('Cannot create product');
      this.logger.info({
        level: 'info',
        message: 'Product created successfully',
        endpoint: 'POST /products',
        productId: result?.id,
        name: dto.name,
        status: 'success',
      });
      return {
        success: true,
        message: `Product ${dto.name} created successfully`,
        data: result,
      };
    } catch (error: any) {
      this.logger.error({
        level: 'error',
        message: 'Product creation failed',
        endpoint: 'POST /products',
        name: dto.name,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async findAll(
    paginationDto?: CursorPaginationRequestDto,
  ): Promise<ServiceResult<CursorPaginationResponseDto<Product>>> {
    try {
      const result = await this.paginationService.paginate<Product>(
        this.productsRepository,
        paginationDto,
        {},
      );
      this.logger.info({
        level: 'info',
        message: 'Retrieved all products',
        endpoint: 'GET /products',
        count: result.data.length,
        status: 'success',
      });
      return {
        success: true,
        message: `Retrieved ${result.data.length} products`,
        data: result,
      };
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

  async findOne(id: number): Promise<ServiceResult<Product>> {
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
      return {
        success: true,
        message: `Found product with id ${id}`,
        data: product,
      };
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

  async findBySlug(slug: string): Promise<ServiceResult<Product>> {
    try {
      const product = await this.productsRepository.findBySlug(slug);
      if (!product) {
        this.logger.warn({
          level: 'warn',
          message: 'Product not found',
          endpoint: 'GET /products/:slug',
          status: 'failure',
        });
        throw new NotFoundException(`Product with slug ${slug} not found`);
      }
      this.logger.info({
        level: 'info',
        message: 'Retrieved product by slug',
        endpoint: 'GET /products/:slug',
        slug: slug,
        status: 'success',
      });
      return {
        success: true,
        message: `Found product with slug ${slug}`,
        data: product,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: 'Failed to retrieve product',
        endpoint: 'GET /products/:slug',
        slug: slug,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    files: Express.Multer.File[],
  ): Promise<ServiceResult<Product>> {
    try {
      if (dto.name) {
        const generatedSlug = slugify(dto.name, { lower: true, strict: true });
        const resolvedProduct =
          await this.productsRepository.findBySlug(generatedSlug);
        if (resolvedProduct)
          throw new BadRequestException(
            `Product with slug ${generatedSlug} already exists`,
          );
        dto.slug = generatedSlug;
      }

      const images = await Promise.all(
        files.map((file) => this.cloudinary.uploadFile(file)),
      );

      const result = await this.productsRepository.update(id, {
        ...dto,
        images: images.map((image) => ({
          imageUrl: image.imageUrl,
          publicId: image.publicId,
          width: image.width,
          height: image.height,
          fileSize: image.fileSize,
          format: image.format,
          sortOrder: 0,
          altText: image.altText,
        })),
      });
      this.logger.info({
        level: 'info',
        message: 'Product updated successfully',
        endpoint: 'PUT /products/:id',
        productId: id,
        status: 'success',
      });
      return {
        success: true,
        message: `Product updated successfully`,
        data: result,
      };
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

  async remove(id: number): Promise<ServiceResult<Product>> {
    try {
      const result = await this.productsRepository.delete(id);
      this.logger.info({
        level: 'info',
        message: 'Product deleted successfully',
        endpoint: 'DELETE /products/:id',
        productId: id,
        status: 'success',
      });
      return {
        success: true,
        message: `Product deleted successfully`,
        data: result,
      };
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
}
