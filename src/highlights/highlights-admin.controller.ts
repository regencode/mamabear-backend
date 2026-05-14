import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';

@ApiTags('highlights (admin)')
@Controller('api/highlights')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
export class HighlightsAdminController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Post()
  create(@Body() createHighlightDto: CreateHighlightDto) {
    return this.highlightsService.create(createHighlightDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHighlightDto: UpdateHighlightDto,
  ) {
    return this.highlightsService.update(+id, updateHighlightDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.highlightsService.remove(+id);
  }
}
