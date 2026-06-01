import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ApiTags } from '@nestjs/swagger';
import { CalculateShippingCostDto } from './dto/calculate-cost.dto';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('province')
  findAllProvince() {
    return this.shippingService.findAllProvince();
  }

  @Get('city/:provinceId')
  findCitiesByProvinceId(@Param('provinceId') provinceId: string) {
    return this.shippingService.findCitiesByProvinceId(provinceId);
  }

  @Get('district/:cityId')
  findDistrictsByCityId(@Param('cityId') cityId: string) {
    return this.shippingService.findDistrictsByCityId(cityId);
  }

  @Get('subdistrict/:districtId')
  findSubdistrictsByDistrictId(@Param('districtId') districtId: string) {
    return this.shippingService.findSubdistrictsByDistrictId(districtId);
  }

  @Post('cost')
  calculateShippingCost(@Body() dto: CalculateShippingCostDto) {
    return this.shippingService.calculateShippingCost(dto);
  }
}
