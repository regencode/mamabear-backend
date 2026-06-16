import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @Get()
  findAllAdmin(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

}
