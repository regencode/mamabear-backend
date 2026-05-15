import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('categories (admin)')
@Controller('api/categories')
@UseGuards(JwtAuthGuard)
@Roles([Role.ADMIN])
export class CategoryAdminController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
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
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategory(req.user.id, dto, file);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
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
    @Req() req,
    @Param('id') categoryId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(
      req.user.id,
      categoryId,
      dto,
      file,
    );
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') categoryId: number) {
    return this.categoryService.deleteCategory(req.user.id, categoryId);
  }
}
