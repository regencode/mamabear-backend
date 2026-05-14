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
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly logger: PinoLogger,
    private readonly paginationService: CursorPaginationService,
  ) {
    this.logger.setContext(ProductsService.name);
  }

  async create(dto: CreateProductDto) {
    try {
      if(!dto.variants) dto.variants = [];
      const defaultVariant: CreateVariantDto = {
          name: "INTERNAL_DEFAULT",
          priceIdr: dto.priceIdr,
          weightG: dto.weightG,
          stock: dto.stock,
          sku: dto.sku,
          sortOrder: 0, // default
      } 
      dto.variants.push(defaultVariant);
      const result = await this.productsRepository.create(dto);
      if(!result) throw new BadRequestException('Cannot create product');
      this.logger.info({
        level: 'info',
        message: 'Product created successfully',
        endpoint: 'POST /products',
        productId: result?.id,
        name: dto.name,
        status: 'success',
      });
      return result;
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

  async findAll(paginationDto?: CursorPaginationRequestDto) {
    try {
        const result = await this.paginationService.paginate({
            findMany: this.productsRepository.findAll
        },
        paginationDto,
        {},
        )
      this.logger.info({
        level: 'info',
        message: 'Retrieved all products',
        endpoint: 'GET /products',
        count: result.data.length,
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
  async findBySlug(slug: string) {
    try {
      const product = await this.productsRepository.findBySlug(slug);
      if (!product) {
        this.logger.warn({
          level: 'warn',
          message: 'Product not found',
          endpoint: 'GET /products/:id',
          status: 'failure',
        });
        throw new NotFoundException(`Product with slug ${slug} not found`);
      }
      this.logger.info({
        level: 'info',
        message: 'Retrieved product by id',
        endpoint: 'GET /products/:id',
        slug: slug,
        status: 'success',
      });
      return product;
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

  async update(id: number, dto: UpdateProductDto) {
    try {
    if (dto.name) {
      const generatedSlug = slugify(dto.name, { lower: true, strict: true });
      const resolvedProduct = await this.productsRepository.findBySlug(generatedSlug);
      if (resolvedProduct) throw new BadRequestException(`Product with slug ${generatedSlug} already exists`);
      dto.slug = generatedSlug;
    }
      const result = await this.productsRepository.update(id, dto);
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
}
