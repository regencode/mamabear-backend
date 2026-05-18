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
import { Type } from 'class-transformer';
import { CreateVariantImageDto } from './create-variant-image.dto';

export class CreateVariantDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  productId?: number;

  @ApiProperty({ example: 'S-26 Procal Gold 3 - 900g' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: [] })
  @IsObject()
  @IsOptional()
  images?: CreateVariantImageDto[];

  @ApiProperty({ example: 185000 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  priceIdr: number;

  @ApiProperty({ example: 900 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  weightG: number;

  @ApiPropertyOptional({ example: 'S26-PROCAL-3-900' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder: number;
}
