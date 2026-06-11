import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { AdminCustomersListResponseDto } from './dto/admin-customers-list-response.dto';
import { AdminCustomerDetailDto } from './dto/admin-customer-detail.dto';

@ApiTags('customers (admin)')
@Controller('admin/customers')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
export class AdminCustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: AdminCustomersListResponseDto })
  findAll(@Query() query: ListCustomersQueryDto) {
    return this.usersService.findCustomers(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponse({ type: AdminCustomerDetailDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findCustomerDetail(id);
  }
}
