import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  addMyAddress(@Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(createAddressDto);
  }

  @Get()
  findMyAddresses() {
    return this.addressesService.findAll();
  }

  @Get(':id')
  findMyAddress(@Param('id') id: string) {
    return this.addressesService.findOne(+id);
  }

  @Put(':id')
  updateMyAddress(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(+id, updateAddressDto);
  }

  @Delete(':id')
  deleteMyAddress(@Param('id') id: string) {
    return this.addressesService.remove(+id);
  }
}
