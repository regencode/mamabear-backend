import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ReviewsService } from '@/reviews/reviews.service';
import { CreateReviewDto } from '@/reviews/dto/create-review.dto';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { VariantService } from '@/variant/variant.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { SearchRequestDto } from '@/search/dto/search-request.dto';
import { SearchService } from '@/search/search.service';
import { SearchAutocompleteOptionsDto } from '@/search/dto/search-autocomplete-options.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { format } from '@fast-csv/format';
import { Response } from 'express';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly variantService: VariantService,
    private readonly searchService: SearchService,
  ) {}

  @Get('exportss')
  async exportProduct(@Res() res: Response) {
    const result = await this.productsService.exportProducts();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');

    const csvStream = format({
      headers: ['Name', 'SKU', 'Price', 'Stock', 'Total Sold', 'Category'],
    });

    csvStream.pipe(res);

    result.data.forEach((product) => {
      csvStream.write({
        Name: product.name,
        SKU: product.sku,
        Price: product.priceIdr,
        Stock: product.stock,
        'Total Sold': product.totalSold,
        Category: product.category,
      });
    });

    csvStream.end();
  }

  @Get()
  findAll(@Query() paginationDto: CursorPaginationRequestDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get('search')
  searchForProducts(@Query() query: SearchRequestDto) {
    return this.searchService.findProductsMatchingQuery(query);
  }

  @Get('filter')
  filterProducts(@Query() query: FilterProductsDto) {
    return this.productsService.findProductsWithFilter(query);
  }
  @Get('search/suggestions')
  suggestAutocomplete(
    @Query() query: SearchRequestDto,
    @Query() options?: SearchAutocompleteOptionsDto,
  ) {
    return this.searchService.getFuzzyAutocompleteResults(query, options);
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':slug/related')
  findRelatedProductsBySlug(@Param('slug') slug: string) {
    return this.productsService.findRelatedProducts(slug);
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
  @Get(':slug/reviews/summary')
  getReviewSummaryOfProductWithSlug(@Param('slug') slug: string) {
    return this.reviewsService.getReviewSummaryOfProductWithSlug(slug);
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
}
