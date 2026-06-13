import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address.dto';
import { AdminCustomerOrderSummaryDto } from './admin-customer-order-summary.dto';

export class AdminCustomerDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  registered_at: Date;

  @ApiProperty({ nullable: true })
  updated_at: Date | null;

  @ApiProperty({ type: [AddressDto] })
  addresses: AddressDto[];

  @ApiProperty()
  total_orders: number;

  @ApiProperty()
  total_spent: number;

  @ApiProperty()
  average_order_value: number;

  @ApiProperty({ nullable: true })
  last_order_date: Date | null;

  @ApiProperty({ type: [AdminCustomerOrderSummaryDto] })
  order_history: AdminCustomerOrderSummaryDto[];
}
