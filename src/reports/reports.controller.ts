import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Response } from 'express';
import { format } from '@fast-csv/format';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('sales')
  async getSalesReport(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('products')
  async getProductPerformance(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getProductPerformance(query);
  }

  @Get('products/export')
  async exportProducts(
    @Query() query: SalesReportQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.getProductPerformance(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=product-report.csv',
    );

    const csvStream = format({
      headers: true,
    });

    csvStream.pipe(res);

    result.data.forEach((row) => {
      csvStream.write(row);
    });

    csvStream.end();
  }

  @Get('sales/export')
  async exportSales(@Query() query: SalesReportQueryDto, @Res() res: Response) {
    const result = await this.reportsService.getSalesReport(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-report.csv',
    );

    const csvStream = format({
      headers: true,
    });

    csvStream.pipe(res);

    csvStream.write({
      totalRevenue: result.data.totalRevenue,
      orderCount: result.data.orderCount,
      avgOrderValue: result.data.avgOrderValue,
    });

    csvStream.end();
  }
}
