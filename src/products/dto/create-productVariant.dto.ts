import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  variantType: string;

  @IsString()
  variantValue: string;

  @IsOptional()
  @IsString()
  sku: string;

  @IsNumber()
  priceAdjustment: number;

  @IsInt()
  stock: number;
}
