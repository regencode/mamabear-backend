import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@/generated/prisma';

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 'JNE1234567890' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'JNE REG' })
  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ApiPropertyOptional({ example: 'Updated delivery note' })
  @IsString()
  @IsOptional()
  notes?: string;
}
