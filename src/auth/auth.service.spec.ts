import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
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
  };
  const mockJwt = {
    signAsync: jest.fn(),
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

    jest.clearAllMocks();
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
});
