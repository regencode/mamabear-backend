import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListCustomersQueryDto {
  @ApiPropertyOptional({ description: 'Search customers by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort customers by',
    enum: ['id', 'name', 'email', 'phone', 'total_orders', 'total_spent', 'registered_at'],
    default: 'registered_at',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'email', 'phone', 'total_orders', 'total_spent', 'registered_at'])
  sort?: 'id' | 'name' | 'email' | 'phone' | 'total_orders' | 'total_spent' | 'registered_at' = 'registered_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Page number', type: Number, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of customers per page', type: Number, default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
