import { IsInt, IsString } from 'class-validator';

export class CreateVariantDto {
  @IsInt()
  productId: number;

  @IsString()
  variantType: string;

  @IsString()
  variantValue: string;

  @IsString()
  sku: string;

  @IsInt()
  priceAdjustment: number;
}
