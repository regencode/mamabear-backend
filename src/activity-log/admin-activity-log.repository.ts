import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { userId: string; action: string; entity: string; entityId: string | null }) {
    return this.prisma.adminActivityLog.create({ data });
  }

  findByUserId(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.adminActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
