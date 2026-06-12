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
  total_orders: number;

  @ApiProperty()
  total_spent: number;

  @ApiProperty()
  registered_at: Date;
}
