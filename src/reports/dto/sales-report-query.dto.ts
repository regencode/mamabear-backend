import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SalesReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Group by: day, week, month, year', default: 'day' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value ?? 'day')
  groupBy?: 'day' | 'week' | 'month' | 'year';
}
