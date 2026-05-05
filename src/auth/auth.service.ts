import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { MailService } from './mail.service';
import { JwtService } from '@nestjs/jwt';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}
  async login(dto: LoginUserDto) {
    const user = await this.repo.findEmail(dto.email);

    if (!user) throw new BadRequestException('Email not found');

    const isValid = await bcrypt.compare(dto.password, user.hashedPassword);

    if (!isValid) throw new BadRequestException('Invalid password');

    if (!user.isVerified)
      throw new BadRequestException('Your account is not verified');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.repo.update(
      { id: user.id },
      {
        refreshToken: hashedRefreshToken,

        refreshTokenExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

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

  async refreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const user = await this.repo.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      await this.repo.update(
        { id: user.id },
        { refreshToken: null, refreshTokenExpiry: null },
      );
      throw new UnauthorizedException('Refresh token expired');
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = await this.jwtService.signAsync(newPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(userId: string) {
    const user = await this.repo.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.repo.update(
      { id: user.id },
      {
        refreshToken: null,
        refreshTokenExpiry: null,
      },
    );

    return {
      message: 'Logout success',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.repo.findEmail(dto.email);

    if (!user) throw new BadRequestException('User not found');

    const resetToken = crypto.randomBytes(32).toString('hex');

    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15);

    await this.repo.update(
      { id: user.id },
      {
        resetToken,
        resetTokenExpiry,
      },
    );

    await this.mailService.sendForgotPasswordPasswordMail(
      dto.email,
      resetToken,
    );

    return {
      message: 'Check your email to reset password',
    };
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    const user = await this.repo.findUserByResetToken(token);

    if (!user) throw new BadRequestException('Invalid token');

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      await this.repo.update(
        { id: user.id },
        {
          resetToken: null,
          resetTokenExpiry: null,
        },
      );
      throw new BadRequestException('Reset token expired');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    await this.repo.update(
      {
        id: user.id,
      },
      {
        hashedPassword: hashed,
        refreshToken: null,
        refreshTokenExpiry: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    );

    return {
      message: 'Password reset success',
    };
  }
}
