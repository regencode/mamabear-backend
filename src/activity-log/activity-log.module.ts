import { Global, Module } from '@nestjs/common';
import { AdminActivityLogService } from './admin-activity-log.service';
import { AdminActivityLogRepository } from './admin-activity-log.repository';

@Global()
@Module({
  providers: [AdminActivityLogService, AdminActivityLogRepository],
  exports: [AdminActivityLogService],
})
export class ActivityLogModule {}
