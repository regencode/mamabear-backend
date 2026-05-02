import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id },
    });
  }

  findUserByVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  update(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where, data });
  }
}
