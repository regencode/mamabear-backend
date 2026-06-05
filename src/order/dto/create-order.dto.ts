import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {  IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: "UUID" })
  @IsString()
  @IsNotEmpty()
  cartId: string;

  @ApiProperty({ example: 1, description: "Final selected address.id" })
  @IsString()
  @IsNotEmpty()
  addressId: number;

  @ApiPropertyOptional({ description: "note from customer" })
  @IsString()
  @IsOptional()
  notes?: string; 
}
