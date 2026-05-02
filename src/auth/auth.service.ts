import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly mailService: MailService,
  ) {}
  login(dto: LoginUserDto) {}

  async register(dto: RegisterUserDto) {
    const emailIsExist = await this.repo.findEmail(dto.email);
    if (emailIsExist) throw new BadRequestException('Email already exist');

    const hashed = await bcrypt.hash(dto.password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60);

    const user = await this.repo.create({
      name: dto.name,
      email: dto.email,
      hashedPassword: hashed,
      phone: dto.phone,

      verificationToken,
      verificationTokenExpiry,
    });
    console.log('USER:', user);

    await this.mailService.sendVerificationEmail(dto.email, verificationToken);

    return {
      message: 'Register success, check your email to verify',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.repo.findUserByVerificationToken(token);

    if (!user) throw new BadRequestException('Invalid token');

    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    )
      throw new BadRequestException('Token expired');

    await this.repo.update(
      { id: user.id },
      {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    );

    return {
      message: 'Email verified successfully',
    };
  }
}
