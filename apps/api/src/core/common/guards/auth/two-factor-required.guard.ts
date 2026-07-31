import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class TwoFactorRequiredGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id as string | undefined;

    if (!userId) {
      throw new ForbiddenException('يجب تسجيل الدخول');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled) {
      throw new ForbiddenException(
        'يجب تفعيل المصادقة الثنائية قبل رفع مستندات الهوية',
      );
    }

    return true;
  }
}
