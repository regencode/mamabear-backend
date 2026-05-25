import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'S-26 Procal Gold 3' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Growing-up formula for children aged 1-3 years.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Growing-up formula for children aged 1-3 years.' })
  @IsString()
  ingredients: string;

  @ApiProperty({ example: 'Growing-up formula for children aged 1-3 years.' })
  @IsString()
  usageInstructions: string;

  // put in default variant
  @ApiProperty({ example: 900 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  weightG: number;

  @ApiProperty({ example: 185000 })
  @Type(() => Number)
  @IsNumber()
  priceIdr: number;

  @ApiPropertyOptional({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'S26-PROCAL-3-900' })
  @IsString()
  @IsOptional()
  sku?: string;
  // put in default variant

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];

  @ApiPropertyOptional({ example: 's-26-procal-gold-3' })
  @IsString()
  @IsOptional()
  slug: string;

  @ApiPropertyOptional({ example: ['formula', 'growing-up', 'toddler'] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
