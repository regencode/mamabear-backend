import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminCustomersQueryDto } from './dto/admin-customers-query.dto';
import { AdminCustomersListResponseDto } from './dto/admin-customers-list-response.dto';
import { AdminCustomerDetailDto } from './dto/admin-customer-detail.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('customers (admin)')
@Controller('admin/customers')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN, Role.SUPERADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class AdminCustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('export')
  async export(@Query() query: AdminCustomersQueryDto, @Res() res: Response) {
    await this.usersService.exportCustomersToCSV(query, res);
  }

  @Get()
  @ApiOkResponse({ type: AdminCustomersListResponseDto })
  findAll(@Query() query: AdminCustomersQueryDto) {
    return this.usersService.findCustomers(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponse({ type: AdminCustomerDetailDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findCustomerDetail(id);
  }

  @Put(':id/status')
  @ApiParam({ name: 'id', required: true })
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
