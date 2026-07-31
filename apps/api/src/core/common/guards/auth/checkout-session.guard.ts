import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * 🛡️ Checkout Session Guard
 *
 * يتحقق من صلاحية جلسة الشراء للمستخدمين الضيوف
 * يستخدم JWT token مع نوع 'checkout_session'
 */
@Injectable()
export class CheckoutSessionGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('جلسة الشراء غير صالحة');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });

      // التحقق من نوع التوكن - نقبل توكنات الشراء أو توكنات الوصول العادية فقط.
      // 🔒 رفض التوكنات بدون نوع صريح (كل التوكنات الشرعية تحمل type).
      const isCheckout =
        payload.type === 'checkout_session' || payload.type === 'checkout';
      const isAccess = payload.type === 'access';

      if (!isCheckout && !isAccess) {
        throw new UnauthorizedException('جلسة الشراء غير صالحة');
      }

      // إضافة بيانات الجلسة للطلب
      // 🔒 F2-01: expose `verified` + `type` so purchase/order endpoints can
      // reject non-OTP-verified (quick-login/cart) checkout sessions.
      request.checkoutSession = {
        phoneNumber: payload.phoneNumber || payload.phone,
        email: payload.email,
        storeId: payload.storeId,
        sessionId: payload.sessionId,
        userId: payload.sub || payload.id,
        type: payload.type,
        // Full access tokens are inherently verified; checkout tokens carry a flag.
        verified: isAccess ? true : payload.verified === true,
        scope: payload.scope,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('انتهت صلاحية جلسة الشراء');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
