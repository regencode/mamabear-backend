import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  Header,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminCustomersQueryDto } from './dto/admin-customers-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Response } from 'express';

@ApiTags('customers (admin)')
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
export class CustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAllCustomers(@Query() query: AdminCustomersQueryDto) {
    return this.usersService.findCustomers(query);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async exportCustomers(
    @Query() query: AdminCustomersQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.usersService.exportCustomersCsv(query);
    const filename = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(':id')
  findOneCustomer(@Param('id') id: string) {
    return this.usersService.findCustomerDetail(id);
  }

  @Put(':id/status')
  updateCustomerStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
  ) {
    return this.usersService.updateStatus(id, dto, {
      id: req.user.sub,
      role: req.user.role,
    });
  }
}
