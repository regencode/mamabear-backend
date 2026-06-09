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
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getDashboard() {
    return this.reportsService.getDashboard();
  }
}
