import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(['ADMIN'])
  @Post()
  create(@Req() req, @Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(['ADMIN'])
  @Put(':id')
  update(
    @Req() req,
    @Param('id') categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(req.user.id, categoryId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(['ADMIN'])
  @Delete(':id')
  delete(@Req() req, @Param('id') categoryId: number) {
    return this.categoryService.deleteCategory(req.user.id, categoryId);
  }

  @Get()
  findAll() {
    return this.categoryService.getAllCategory();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoryService.getCategoryBySlug(slug);
  }

  @Get(':slug/product')
  findProduct(@Param('slug') slug: string) {
    return this.categoryService.getProductByCategory(slug);
  }
}
