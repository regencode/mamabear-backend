import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';

@ApiTags('categories (admin)')
@Controller('api/categories')
@UseGuards(JwtAuthGuard)
@Roles([Role.ADMIN])
export class CategoryAdminController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Req() req,
    @Param('id') categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(req.user.id, categoryId, dto);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') categoryId: number) {
    return this.categoryService.deleteCategory(req.user.id, categoryId);
  }
}
