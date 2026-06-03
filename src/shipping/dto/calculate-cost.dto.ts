import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsPositive, IsString } from 'class-validator';

export enum PriceSort {
  HIGHEST = 'highest',
  LOWEST = 'lowest',
}

export class CalculateShippingCostDto {
  @ApiProperty({
    example: 114,
    description: 'Destination location ID',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  destination!: number;

  @ApiProperty({
    enum: PriceSort,
    example: PriceSort.LOWEST,
    description: 'Sort shipping price result',
  })
  @IsEnum(PriceSort)
  price?: PriceSort;
}
