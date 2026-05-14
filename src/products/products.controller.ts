import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { ReviewsService } from '@/reviews/reviews.service';
import { CreateReviewDto } from '@/reviews/dto/create-review.dto';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CreateDiscountDto } from '@/discounts/dto/create-discount.dto';
import { DiscountsService } from '@/discounts/discounts.service';
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';
import { VariantService } from '@/variant/variant.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly discountsService: DiscountsService,
    private readonly variantService: VariantService,
  ) {}

  @Get()
  findAll(@Query() paginationDto: CursorPaginationRequestDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':slug/variants')
  getProductVariantBySlug(@Param('slug') slug: string) {
    return this.variantService.getProductVariantBySlug(slug);
  }

  @Get(':slug/reviews')
  findAllReviewsOfProductBySlug(
    @Param('slug') slug: string,
    @Query() paginationDto: CursorPaginationRequestDto,
  ) {
    return this.reviewsService.findReviewsOfProductBySlug(slug, paginationDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Post(':slug/reviews')
  createReviewForProduct(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReviewForProductWithSlug(slug, dto);
  }

  @UseGuards(new JwtAuthGuard())
  @Patch(':slug/reviews/:reviewId/upvote')
  upvoteReviewOfProduct(@Param('reviewId') reviewId: number) {
    return this.reviewsService.upvoteReviewWithId(reviewId);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Delete(':id/reviews/:reviewId')
  removeReview(@Param('reviewId') reviewId: number) {
    return this.reviewsService.remove(reviewId);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Post(':id/variant/:variantId/discount')
  createDiscount(
      @Param('variantId') variantId: number,
      @Body() dto: CreateDiscountDto,
  ) {
      // admin only
    dto.variantId = variantId;
    this.discountsService.create(dto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Post(':id/variants')
  createProductVariant(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: CreateVariantDto,
  ) {
      // admin only
    console.log('DTO : ', dto);
    dto.productId = id;
    return this.variantService.createVariant(req.user.id, dto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    // admin only
    return this.productsService.create(createProductDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    // admin only
    return this.productsService.update(+id, updateProductDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Delete(':id')
  remove(@Param('id') id: string) {
    // admin only
    return this.productsService.remove(+id);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Get(':id/reviews')
  findAllReviewsOfProduct(
    @Param('id') productId: number,
    @Query() paginationDto: CursorPaginationRequestDto,
  ) {
    return this.reviewsService.findReviewsOfProduct(productId, paginationDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Get(':id/variants')
  getProductVariant(@Param('id') id: number) {
    return this.variantService.getProductVariant(id);
  }


}
