import { Controller, Get } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('province')
  findAllProvince() {
    return this.shippingService.findAllProvince();
  }
}
