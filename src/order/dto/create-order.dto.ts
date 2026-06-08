import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  addressId: number;

  @ApiProperty({ example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: 'JNE' })
  @IsString()
  @IsNotEmpty()
  courierCode: string;

  @ApiProperty({ example: 'REG' })
  @IsString()
  @IsNotEmpty()
  courierService: string;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  shippingCostIdr: number;

  @ApiPropertyOptional({ example: 'Please deliver before noon' })
  @IsOptional()
  @IsString()
  notes?: string;
}
