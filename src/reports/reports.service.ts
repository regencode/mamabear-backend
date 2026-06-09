import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  async getDashboard() {
    const [
      getOrderCount,
      getCustomerCount,
      getProductCount,
      getRecentOrder,
      getLowStockProducts,
      getTopSellingProducts,
      getRevenueOrders,
    ] = await Promise.all([
      this.repo.getOrderCount(),
      this.repo.getCustomerCount(),
      this.repo.getProductCount(),
      this.repo.getRecentOrder(),
      this.repo.getLowStockProducts(),
      this.repo.getTopSellingProducts(),
      this.repo.getRevenueOrders(),
    ]);

    const totalRevenue = getRevenueOrders.reduce(
      (sum, order) =>
        sum + order.subtotalIdr + order.taxIdr + order.shippingCostIdr,
      0,
    );

    return {
      success: true,
      message: `Dashboard`,
      data: {
        getRevenueOrders,
        totalRevenue,
        getOrderCount,
        getCustomerCount,
        getProductCount,
        getRecentOrder,
        getLowStockProducts,
        getTopSellingProducts,
      },
    };
  }
}
