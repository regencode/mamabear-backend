import { Controller, Get, Param, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';

@ApiTags('settings (admin)')
@Controller('admin/settings')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
export class SettingsAdminController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.upsertByKey(key, dto);
  }
}
