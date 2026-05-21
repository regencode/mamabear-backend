import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  variantId: number;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}