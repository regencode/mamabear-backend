import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { ReviewsService } from '@/reviews/reviews.service';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CreateDiscountDto } from '@/discounts/dto/create-discount.dto';
import { DiscountsService } from '@/discounts/discounts.service';
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';
import { UpdateVariantDto } from '@/variant/dto/update-variant.dto';
import { VariantService } from '@/variant/variant.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('products (admin)')
@Controller('api/products')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
export class ProductsAdminController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly discountsService: DiscountsService,
    private readonly variantService: VariantService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 40 * 1024 * 1024,
      },
      fileFilter(req, file, callback) {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(dto, files);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 40 * 1024 * 1024,
      },
      fileFilter(req, file, callback) {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(+id, updateProductDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post(':id/variants')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 40 * 1024 * 1024,
      },
      fileFilter(req, file, callback) {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
    }),
  )
  createProductVariant(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: CreateVariantDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    dto.productId = id;
    return this.variantService.createVariant(req.user.id, dto, files);
  }

  @Get(':id/variants')
  getProductVariant(@Param('id') id: number) {
    return this.variantService.getProductVariant(id);
  }

  @Get(':id/reviews')
  findAllReviewsOfProduct(
    @Param('id') productId: number,
    @Query() paginationDto: CursorPaginationRequestDto,
  ) {
    return this.reviewsService.findReviewsOfProduct(productId, paginationDto);
  }

  @Delete(':id/reviews/:reviewId')
  removeReview(@Param('reviewId') reviewId: number) {
    return this.reviewsService.remove(reviewId);
  }

  @Post(':id/variants/:variantId/discount')
  createDiscount(
    @Param('variantId') variantId: number,
    @Body() dto: CreateDiscountDto,
  ) {
    dto.variantId = variantId;
    return this.discountsService.create(dto);
  }

  @Put('variants/:id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 40 * 1024 * 1024,
      },
      fileFilter(req, file, callback) {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
    }),
  )
  updateVariant(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: UpdateVariantDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.variantService.updateVariant(req.user.id, id, dto, files);
  }

  @Delete('variants/:id')
  deleteVariant(@Req() req, @Param('id') id: number) {
    return this.variantService.deleteVariant(req.user.id, id);
  }

  @Delete('reviews/:id')
  removeReviewStandalone(@Param('id') id: number) {
    return this.reviewsService.remove(id);
  }
}
