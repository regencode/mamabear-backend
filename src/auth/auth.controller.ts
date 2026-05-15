import { JwtAuthGuard } from './guard/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtPayload } from '@/types/JwtPayload';

@UseGuards(ThrottlerGuard)
@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({
    default: {
      limit: 10,
      ttl: 300_000,
    },
  })
  @Post('/login')
  login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 300_000,
    },
  })
  @Post('/register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  logout(@Req() req: JwtPayload) {
    return this.authService.logout(req.sub);
  }

  @Throttle({
    default: {
      limit: 10,
      ttl: 300_000,
    },
  })
  @Post('/refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 300_000,
    },
  })
  @Post('/forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 300_000,
    },
  })
  @Post('/reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(token, dto);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 300_000,
    },
  })
  @Get('/verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('create-admin')
  createAdmin(@Body() dto: RegisterUserDto) {
    return this.authService.createAdmin(dto);
  }
}
