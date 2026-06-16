import { Injectable } from '@nestjs/common';
import { AdminActivityLogRepository } from './admin-activity-log.repository';

@Injectable()
export class AdminActivityLogService {
  constructor(
    private readonly adminActivityLogRepository: AdminActivityLogRepository,
  ) {}

  async log(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
  ) {
    try {
      return await this.adminActivityLogRepository.create({
        userId,
        action,
        entity,
        entityId: entityId ?? null,
      });
    } catch {
      // Activity logging is best-effort; never crash the main request
    }
  }
}
