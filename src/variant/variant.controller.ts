import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('variants')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(['ADMIN'])
  @Put(':id')
  update(@Req() req, @Param('id') id: number, @Body() dto: UpdateVariantDto) {
    return this.variantService.updateVariant(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(['ADMIN'])
  @Delete(':id')
  delete(@Req() req, @Param('id') id: number) {
    return this.variantService.deleteVariant(req.user.id, id);
  }
}
