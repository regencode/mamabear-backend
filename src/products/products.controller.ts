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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { CreateProductVariantDto } from './dto/create-productVariant.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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

  // Variant
  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Post(':id/variants')
  createProductVariant(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: CreateProductVariantDto,
  ) {
    console.log('DTO : ', dto);
    return this.productsService.createVariant(req.user.id, id, dto);
  }

  @Get(':id/variants')
  getProductVariant(@Param('id') id: number) {
    return this.productsService.getProductVariant(id);
  }
}
