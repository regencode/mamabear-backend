import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { ProductReportQueryDto } from './dto/product-report-query.dto';
import {
  PagePaginationMetaDto,
  PagePaginationResponseDto,
} from '@/common/dto/response/page-pagination.response.dto';

@ApiTags('reports (admin)')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('sales')
  getSalesReport(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('products')
  async getProductReport(@Query() query: ProductReportQueryDto) {
    const { items, totalItems } =
      await this.reportsService.getProductReport(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const meta = new PagePaginationMetaDto(page, limit, totalItems);
    const result = new PagePaginationResponseDto(items, meta);
    return {
      success: true,
      message: `Returned ${items.length} products (page ${page} of ${meta.totalPages})`,
      data: result,
    };
  }
}
