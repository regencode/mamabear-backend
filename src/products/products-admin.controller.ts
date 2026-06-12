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
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { ReviewsService } from '@/reviews/reviews.service';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CreateDiscountDto } from '@/discounts/dto/create-discount.dto';
import { DiscountsService } from '@/discounts/discounts.service';
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';
import { UpdateVariantDto } from '@/variant/dto/update-variant.dto';
import { VariantService } from '@/variant/variant.service';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';
import { ReviewPaginationDto } from '@/reviews/dto/review-pagination.dto';
import { memoryStorage } from 'multer';

@ApiTags('products (admin)')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
export class ProductsAdminController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly discountsService: DiscountsService,
    private readonly variantService: VariantService,
  ) {}

  @Get()
  findAllAdmin(@Query() query: AdminProductsQueryDto) {
    return this.productsService.findAdminProducts(query);
  }

  @Post()
  create(
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post(':id/variants')
  createProductVariant(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: CreateVariantDto,
  ) {
    dto.productId = id;
    return this.variantService.createVariant(req.user.id, dto);
  }

  @Get(':id/variants')
  getProductVariant(@Param('id') id: number) {
    return this.variantService.getProductVariant(id);
  }

  @Get(':id/reviews')
  findAllReviewsOfProduct(
    @Param('id') productId: number,
    @Query() paginationDto: ReviewPaginationDto,
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
  updateVariant(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantService.updateVariant(req.user.id, id, dto);
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
