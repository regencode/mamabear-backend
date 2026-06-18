import { ApiProperty } from '@nestjs/swagger';

export class AdminCustomerItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  isBlocked: boolean;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  registeredAt: Date;
}
