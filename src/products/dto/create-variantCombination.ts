import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantCombinationItemDto {
  @IsObject()
  combination: Record<string, string>;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  price: number;

  @IsInt()
  stock: number;
}

export class CreateVariantCombinationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantCombinationItemDto)
  combinations: VariantCombinationItemDto[];
}
