import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { MailService } from './mail.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, MailService],
})
export class AuthModule {}
