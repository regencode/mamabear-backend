import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let repo: AuthRepository;
  let prisma: PrismaService;
  let jwt: JwtService;
  let mail: MailService;

  const mockRepo = {
    findEmail: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findUserByVerificationToken: jest.fn(),
    findUserById: jest.fn(),
  };
  const mockJwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const mockMail = {
    sendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    repo = module.get<AuthRepository>(AuthRepository);
    service = module.get<AuthService>(AuthService);

    jest.resetAllMocks();
  });

  it('should login successfully', async () => {
    const dto = { email: 'test@gmail.com', password: 'test123' };

    const user = {
      id: 'userId-1',
      email: 'test@gmail.com',
      hashedPassword: 'hashed',
      isVerified: true,
    };

    const result = {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    mockRepo.findEmail.mockResolvedValue(user);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedRefreshToken' as never);

    mockJwt.signAsync
      .mockResolvedValueOnce('accessToken' as never)
      .mockResolvedValueOnce('refreshToken' as never);

    const resultResponse = await service.login(dto);
    expect(resultResponse).toEqual(result);
    expect(mockRepo.findEmail).toHaveBeenCalledWith(dto.email);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      dto.password,
      user.hashedPassword,
    );
    expect(mockJwt.signAsync).toHaveBeenCalledTimes(2);
    expect(mockRepo.update).toHaveBeenCalledWith(
      { id: user.id },
      expect.objectContaining({
        refreshToken: 'hashedRefreshToken',
        refreshTokenExpiry: expect.any(Date),
      }),
    );
  });

  it('should throw BadRequestException if email is not found', async () => {
    const dto = { email: 'wrong@gmail.com', password: 'password' };

    mockRepo.findEmail.mockResolvedValue(null);

    await expect(service.login(dto)).rejects.toThrow(
      new BadRequestException('Email not found'),
    );
  });

  it('should throw BadRequestException if password is invalid', async () => {
    const dto = { email: 'test@gmail.com', password: 'wrongPassword' };

    const user = {
      id: 'userId-1',
      email: 'test@gmail.com',
      hashedPassword: 'hashed',
      isVerified: true,
    };

    mockRepo.findEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

    await expect(service.login(dto)).rejects.toThrow(
      new BadRequestException('Invalid password'),
    );
  });

  it('should throw BadRequestException if user is not verified', async () => {
    const dto = { email: 'test@gmail.com', password: 'test123' };
    const user = {
      id: 'userId-1',
      email: 'test@gmail.com',
      hashedPassword: 'hashed',
      isVerified: false,
    };
    mockRepo.findEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

    await expect(service.login(dto)).rejects.toThrow(
      new BadRequestException('Invalid password'),
    );
  });

  it('should register successfully', async () => {
    const dto = {
      email: 'test@gmail.com',
      password: 'test123',
      name: 'test',
      phone: '0822',
    };

    const result = {
      message: 'Register success, check your email to verify',
    };

    mockRepo.findEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    (crypto.randomBytes as jest.Mock).mockReturnValue({
      toString: () => 'verificationToken',
    });

    mockRepo.create.mockResolvedValue({
      id: 'userId-1',
      ...dto,
    });

    const sendEmailSpy = jest
      .spyOn(mockMail, 'sendVerificationEmail')
      .mockResolvedValue(undefined);

    const resultResponse = await service.register(dto);
    expect(resultResponse).toEqual(result);
    expect(mockRepo.findEmail).toHaveBeenCalledWith(dto.email);
    expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    expect(mockRepo.create).toHaveBeenCalledWith({
      name: dto.name,
      email: dto.email,
      hashedPassword: 'hashedPassword',
      phone: dto.phone,
      verificationToken: 'verificationToken',
      verificationTokenExpiry: expect.any(Date),
    });
    expect(sendEmailSpy).toHaveBeenCalledWith(dto.email, 'verificationToken');
  });

  it('should throw BadRequestException if email already exist', async () => {
    const dto = {
      email: 'test@gmail.com',
      password: 'test123',
      name: 'test',
      phone: '0822',
    };

    mockRepo.findEmail.mockResolvedValue(dto);

    await expect(service.register(dto)).rejects.toThrow(
      new BadRequestException('Email already exist'),
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should verify email successfully', async () => {
    const user = {
      id: 'userId-1',
      verificationToken: 'valid-token',
      verificationTokenExpiry: new Date('2099-01-01'),
    };

    const result = {
      message: 'Email verified successfully',
    };

    mockRepo.findUserByVerificationToken.mockResolvedValue(user);
    const resultResPonse = await service.verifyEmail(user.verificationToken);
    expect(resultResPonse).toEqual(result);

    const responseFindUser = await repo.findUserByVerificationToken(
      user.verificationToken,
    );

    expect(mockRepo.findUserByVerificationToken).toHaveBeenCalledWith(
      user.verificationToken,
    );

    expect(mockRepo.update).toHaveBeenCalledWith(
      { id: user.id },
      expect.objectContaining({
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      }),
    );
  });

  it('should throw BadRequestException for invalid token', async () => {
    const user = {
      id: 'userId-1',
      verificationToken: 'valid-token',
      verificationTokenExpiry: new Date('2099-01-01'),
    };

    mockRepo.findUserByVerificationToken.mockResolvedValue(null);

    expect(service.verifyEmail(user.verificationToken)).rejects.toThrow(
      new BadRequestException('Invalid token'),
    );
  });

  it('should throw BadRequestException for token expired', async () => {
    const user = {
      id: 'userId-1',
      verificationToken: 'valid-token',
      verificationTokenExpiry: new Date('1999-01-01'),
    };

    mockRepo.findUserByVerificationToken.mockResolvedValue(user);

    expect(service.verifyEmail(user.verificationToken)).rejects.toThrow(
      new BadRequestException('Token expired'),
    );
  });

  it('should refresh token successfully', async () => {
    const payload = {
      sub: 'userId-1',
    };
    const refreshToken = 'valid-refresh-token';

    const user = {
      id: 'userId-1',
      email: 'test@gmail.com',
      role: 'user',
      refreshToken: 'hashedRefreshToken',
      refreshTokenExpiry: new Date('2099-01-01'),
    };
    const result = {
      accessToken: 'newAccessToken',
    };

    mockJwt.verifyAsync.mockResolvedValue(payload);
    mockRepo.findUserById.mockResolvedValue(user);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    mockJwt.signAsync.mockResolvedValue('newAccessToken');

    const response = await service.refreshToken(refreshToken);

    expect(mockJwt.verifyAsync).toHaveBeenCalledWith(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      refreshToken,
      user.refreshToken,
    );
    expect(mockJwt.signAsync).toHaveBeenCalledWith(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );
    expect(response).toEqual(result);
  });

  it('should throw new UnauthorizedException for refresh token not found', async () => {
    const user = {
      id: 'userId-1',
      refreshToken: null,
    };
    const payload = {
      sub: 'userId-1',
    };
    mockJwt.verifyAsync.mockResolvedValue(payload);
    mockRepo.findUserById.mockResolvedValue(user);

    await expect(service.refreshToken('token')).rejects.toThrow(
      new UnauthorizedException('Refresh token not found'),
    );
  });

  it('should trhow new UnauthorizedException for Invalid iserId', async () => {
    const refreshToken = 'valid-refresh-token';
    const payload = {
      sub: 'userId-1',
    };

    mockJwt.verifyAsync.mockResolvedValue(payload);
    mockRepo.findUserById.mockResolvedValue(null);

    await expect(service.refreshToken(refreshToken)).rejects.toThrow(
      new UnauthorizedException('User not found'),
    );
  });

  it('should throw new UnauthorizedException for invalid refresh token', async () => {
    const refreshToken = 'valid-refresh-token';
    const payload = {
      sub: 'userId-1',
    };
    const user = {
      id: 'userId-1',
      refreshToken: 'invalid-token',
    };
    mockJwt.verifyAsync.mockResolvedValue(payload);
    mockRepo.findUserById.mockResolvedValue(user);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(service.refreshToken(refreshToken)).rejects.toThrow(
      new UnauthorizedException('Invalid refresh token'),
    );
  });

  it('should throw new BadRequestException for refresh token expired', async () => {
    const payload = {
      sub: 'userId-1',
    };
    const user = {
      id: 'userId-1',
      refreshToken: 'valid-token',
      refreshTokenExpiry: new Date('1999-01-01'),
    };
    mockJwt.verifyAsync.mockResolvedValue(payload);
    mockRepo.findUserById.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    await expect(service.refreshToken('token')).rejects.toThrow(
      'Refresh token expired',
    );

    expect(mockRepo.update).toHaveBeenCalledWith(
      { id: user.id },
      { refreshToken: null, refreshTokenExpiry: null },
    );
  });
});
