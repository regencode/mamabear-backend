import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PinoLogger } from 'pino-nestjs';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { ProductReportQueryDto } from './dto/product-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportsService.name);
  }

  async getDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      revenueLast30Days,
      ordersLast7Days,
      topProducts,
      ordersByStatus,
      revenueByDay,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { subtotalIdr: true, shippingCostIdr: true },
        where: {
          status: { in: ['PAYMENT_PAID', 'CONFIRMED', 'PROCESSED', 'SENDING', 'RECEIVED', 'COMPLETED'] },
        },
      }),

      this.prisma.order.count({
        where: {
          status: { in: ['PAYMENT_PAID', 'CONFIRMED', 'PROCESSED', 'SENDING', 'RECEIVED', 'COMPLETED'] },
        },
      }),

      this.prisma.user.count({ where: { role: 'USER' } }),

      this.prisma.product.count({ where: { isActive: true } }),

      this.prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: {
          id: true,
          status: true,
          subtotalIdr: true,
          shippingCostIdr: true,
          paymentMethod: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      this.prisma.order.aggregate({
        _sum: { subtotalIdr: true, shippingCostIdr: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['PAYMENT_PAID', 'CONFIRMED', 'PROCESSED', 'SENDING', 'RECEIVED', 'COMPLETED'] },
        },
      }),

      this.prisma.order.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          totalSold: true,
          images: { take: 1, select: { imageUrl: true } },
        },
        orderBy: { totalSold: 'desc' },
        take: 5,
      }),

      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      this.prisma.$queryRaw`
        SELECT
          DATE("createdAt") AS date,
          SUM("subtotalIdr" + "shippingCostIdr") AS revenue,
          COUNT(*) AS orders
        FROM "Order"
        WHERE "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `,
    ]);

    const totalRevenueAmount =
      (totalRevenue._sum.subtotalIdr ?? 0) +
      (totalRevenue._sum.shippingCostIdr ?? 0);

    const revenueLast30DaysAmount =
      (revenueLast30Days._sum.subtotalIdr ?? 0) +
      (revenueLast30Days._sum.shippingCostIdr ?? 0);

    return {
      overview: {
        totalRevenue: totalRevenueAmount,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueLast30Days: revenueLast30DaysAmount,
        ordersLast7Days,
      },
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count.id,
      })),
      revenueByDay: (revenueByDay as any[]).map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
      topProducts: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        totalSold: p.totalSold,
        thumbnail: p.images[0]?.imageUrl ?? null,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.subtotalIdr + o.shippingCostIdr,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        customer: o.user,
      })),
    };
  }

  async getSalesReport(query: SalesReportQueryDto) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const groupByClause = this.getGroupByClause(query.groupBy ?? 'day');

    const salesData = await this.prisma.$queryRawUnsafe(
      `SELECT
        ${groupByClause} AS period,
        COUNT(*) AS orders,
        SUM("subtotalIdr" + "shippingCostIdr") AS revenue,
        SUM("subtotalIdr") AS subtotal,
        SUM("shippingCostIdr") AS shippingCost,
        COUNT(DISTINCT "userId") AS uniqueCustomers
      FROM "Order"
      WHERE "createdAt" >= $1::timestamp
        AND "createdAt" <= $2::timestamp
        AND status IN ('PAYMENT_PAID','CONFIRMED','PROCESSED','SENDING','RECEIVED','COMPLETED')
      GROUP BY period
      ORDER BY period ASC`,
      startDate,
      endDate,
    );

    const summary = await this.prisma.$queryRawUnsafe(
      `SELECT
        COUNT(*) AS totalOrders,
        SUM("subtotalIdr" + "shippingCostIdr") AS totalRevenue,
        SUM("subtotalIdr") AS totalSubtotal,
        SUM("shippingCostIdr") AS totalShippingCost,
        AVG("subtotalIdr" + "shippingCostIdr") AS averageOrderValue,
        COUNT(DISTINCT "userId") AS uniqueCustomers
      FROM "Order"
      WHERE "createdAt" >= $1::timestamp
        AND "createdAt" <= $2::timestamp
        AND status IN ('PAYMENT_PAID','CONFIRMED','PROCESSED','SENDING','RECEIVED','COMPLETED')`,
      startDate,
      endDate,
    );

    return {
      summary: {
        totalOrders: Number((summary as any[])[0]?.totalorders ?? 0),
        totalRevenue: Number((summary as any[])[0]?.totalrevenue ?? 0),
        totalSubtotal: Number((summary as any[])[0]?.totalsubtotal ?? 0),
        totalShippingCost: Number(
          (summary as any[])[0]?.totalshippingcost ?? 0,
        ),
        averageOrderValue: Number(
          (summary as any[])[0]?.averageordervalue ?? 0,
        ),
        uniqueCustomers: Number(
          (summary as any[])[0]?.uniquecustomers ?? 0,
        ),
      },
      period: query.groupBy ?? 'day',
      data: (salesData as any[]).map((row) => ({
        period: row.period,
        orders: Number(row.orders),
        revenue: Number(row.revenue),
        subtotal: Number(row.subtotal),
        shippingCost: Number(row.shippingcost),
        uniqueCustomers: Number(row.uniquecustomers),
      })),
    };
  }

  async getProductReport(query: ProductReportQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const havingParts: string[] = [];
    const params: any[] = [];

    const whereParts: string[] = ['WHERE p."isActive" = true'];

    if (query.categoryId !== undefined) {
      const p = params.length + 1;
      params.push(query.categoryId);
      whereParts.push(`AND p."categoryId" = $${p}`);
    }

    if (query.minSold !== undefined) {
      havingParts.push(`HAVING p."totalSold" >= ${query.minSold}`);
    }

    const countResult: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) AS total
       FROM "Product" p
       ${whereParts.join(' ')}
       ${havingParts.join(' ')}`,
      ...params,
    );
    const totalItems = Number(countResult[0]?.total ?? 0);

    const offsetP = params.length + 1;
    const limitP = params.length + 2;
    params.push(offset, limit);

    const products: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        p.id,
        p.name,
        p.slug,
        p."totalSold",
        p."categoryId",
        c.name AS category_name,
        COALESCE(
          (SELECT AVG(r.rating) FROM "Review" r WHERE r."productId" = p.id),
          0
        ) AS avg_rating,
        COALESCE(
          (SELECT COUNT(*) FROM "Review" r WHERE r."productId" = p.id),
          0
        ) AS review_count,
        COALESCE(
          (SELECT SUM(oi.quantity) FROM "OrderItem" oi
           JOIN "Order" o ON o.id = oi."orderId"
           WHERE oi."productId" = p.id
             AND o.status IN ('PAYMENT_PAID','CONFIRMED','PROCESSED','SENDING','RECEIVED','COMPLETED')),
          0
        ) AS revenue_units,
        COALESCE(
          (SELECT SUM(oi.quantity * oi.price) FROM "OrderItem" oi
           JOIN "Order" o ON o.id = oi."orderId"
           WHERE oi."productId" = p.id
             AND o.status IN ('PAYMENT_PAID','CONFIRMED','PROCESSED','SENDING','RECEIVED','COMPLETED')),
          0
        ) AS revenue
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id = p."categoryId"
       ${whereParts.join(' ')}
       ${havingParts.join(' ')}
       ORDER BY p."totalSold" DESC, p.id ASC
       OFFSET $${offsetP}
       LIMIT $${limitP}`,
      ...params,
    );

    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      totalSold: p.totalSold,
      categoryId: p.categoryId,
      categoryName: p.category_name,
      averageRating: Number(Number(p.avg_rating).toFixed(2)),
      reviewCount: Number(p.review_count),
      totalRevenueUnits: Number(p.revenue_units),
      totalRevenue: Number(p.revenue),
    }));

    return { items, totalItems };
  }

  private getGroupByClause(groupBy: string): string {
    switch (groupBy) {
      case 'week':
        return `DATE_TRUNC('week', "createdAt")`;
      case 'month':
        return `DATE_TRUNC('month', "createdAt")`;
      case 'year':
        return `DATE_TRUNC('year', "createdAt")`;
      default:
        return `DATE("createdAt")`;
    }
  }
}
