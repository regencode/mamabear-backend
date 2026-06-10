import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateTrackingDto {
  @ApiPropertyOptional({
    example: 'JNE1234567890',
  })
  @IsString()
  trackingNumber!: string;
}
