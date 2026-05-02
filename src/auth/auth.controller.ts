import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  login(dto: LoginUserDto) {}
  
  @Post("/register")
  register(dto: RegisterUserDto) {}

  @Post("/logout")
  logout() {}

  @Post("/refresh")
  refresh() {}

  @Post("/forgot-password")
  forgotPassword() {}
    
  @Post("/reset-password/:token")
  resetPassword(@Param("token") token: string) {
  }

  @Get("/verify-email/:token")
  verifyEmail(@Param("token") token: string) {
  }
}
