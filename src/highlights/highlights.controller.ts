import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';

@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get()
  findAll() {
    return this.highlightsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.highlightsService.findOne(+id);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Post()
  create(@Body() createHighlightDto: CreateHighlightDto) {
    return this.highlightsService.create(createHighlightDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHighlightDto: UpdateHighlightDto,
  ) {
    return this.highlightsService.update(+id, updateHighlightDto);
  }

  @UseGuards(new JwtAuthGuard())
  @Roles([Role.ADMIN])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.highlightsService.remove(+id);
  }
}
