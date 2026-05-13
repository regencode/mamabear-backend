import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { IsObject } from 'class-validator';
import { Discount, ProductImage } from '@/generated/prisma';

export class CreateVariantDto {
    @IsNumber()
    productId?: number; 

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsObject()
    @IsOptional()
    images?: ProductImage;

    @IsNumber()
    @IsNotEmpty()
    priceIdr: number;

    @IsNumber()
    @IsNotEmpty()
    weightG: number; 

    @IsString()
    @IsOptional()
    sku?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    sortOrder: number;
}
