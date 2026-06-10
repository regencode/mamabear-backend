import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';

@ApiTags('customers (admin)')
@Controller('admin/customers')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
export class AdminCustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: ListCustomersQueryDto) {
    return this.usersService.findCustomers(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findCustomerDetail(id);
  }
}
