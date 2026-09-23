import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Validates tracking JWT issued after OTP verification in order-tracking flow.
 */
@Injectable()
export class TrackingSessionGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('جلسة التتبع غير صالحة');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });

      if (payload.type !== 'tracking' || !payload.phone) {
        throw new UnauthorizedException('جلسة التتبع غير صالحة');
      }

      request.trackingSession = {
        phoneNumber: String(payload.phone),
        type: 'tracking' as const,
      };

      return true;
    } catch {
      throw new UnauthorizedException('انتهت صلاحية جلسة التتبع');
    }
  }

  private extractTokenFromHeader(request: {
    headers?: { authorization?: string };
  }): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
