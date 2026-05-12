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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { ReviewsService } from '@/reviews/reviews.service'
import { CreateReviewDto } from '@/reviews/dto/create-review.dto'
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
      private readonly productsService: ProductsService,
      private readonly reviewsService: ReviewsService           
  ) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
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

  @Get(':id/reviews')
  findAllReviewsOfProduct(
    @Param('id') productId: number,
    @Body() paginationDto: CursorPaginationRequestDto,
  ) {
    return this.reviewsService.findReviewsOfProduct(
      productId,
      paginationDto,
    )
  }

  @Post(':id/reviews')
  createReviewForProduct(
    @Param('id') productId: number,
    @Body() dto: CreateReviewDto,
  ) {
    dto.productId = productId
    return this.reviewsService.createReviewForProduct(dto);
  }

  @Patch(':id/reviews/:reviewId/upvote')
  upvoteReviewOfProduct(
    @Param('reviewId') reviewId: number,
  ) {
    return this.reviewsService.upvoteReviewWithId(reviewId)
  }

  @Delete(':id/reviews/:reviewId')
  removeReview(
    @Param('reviewId') reviewId: number,
  ) {
    return this.reviewsService.remove(reviewId)
  }
}

