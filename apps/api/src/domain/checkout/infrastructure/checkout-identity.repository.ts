import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

@Injectable()
export class CheckoutIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phoneNumber: string) {
    return this.prisma.user.findFirst({ where: { phoneNumber } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email } });
  }

  createGuest(phoneNumber?: string, email?: string) {
    return this.prisma.user.create({
      data: { phoneNumber, email, role: 'GUEST', emailVerified: false },
    });
  }
}
