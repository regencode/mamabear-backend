import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';


export class CreateOrderDto {
  @ApiProperty({ description: 'UUID' })
  @IsString()
  @IsNotEmpty()
  cartId: string;

  @ApiProperty({ example: 1, description: 'id of final selected address' })
  @IsNumber()
  @IsNotEmpty()
  addressId: number;

  @ApiPropertyOptional({ description: 'notes from customer' })
  @IsString()
  @IsOptional()
  notes?: string;
}
