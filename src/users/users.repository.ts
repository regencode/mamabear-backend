import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserDto) {
    const { password, ...rest } = data;
    return this.prisma.user.create({
      data: { ...rest, hashedPassword: password },
      select: USER_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  }

  update(id: string, data: UpdateUserDto) {
    const { password, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest };
    if (password !== undefined) {
      updateData.hashedPassword = password;
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
  }

  delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: USER_SELECT,
    });
  }
}
