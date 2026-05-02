import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";


@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}
}
