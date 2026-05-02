import { Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';

@Injectable()
export class AuthService {

  login(dto: LoginUserDto) {}
  
  register(dto: RegisterUserDto) {}
}
