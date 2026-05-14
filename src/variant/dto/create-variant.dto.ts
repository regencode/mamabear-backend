import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Discount, ProductImage } from '@/generated/prisma';

export class CreateVariantDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  productId?: number;

  @ApiProperty({ example: 'S-26 Procal Gold 3 - 900g' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  images?: ProductImage;

  @ApiProperty({ example: 185000 })
  @IsNumber()
  @IsNotEmpty()
  priceIdr: number;

  @ApiProperty({ example: 900 })
  @IsNumber()
  @IsNotEmpty()
  weightG: number;

  @ApiPropertyOptional({ example: 'S26-PROCAL-3-900' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder: number;
}
