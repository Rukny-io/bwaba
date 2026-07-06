import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { RedisService } from '../../core/cache/redis.service';
import * as crypto from 'crypto';

/**
 * 🔗 Account Linking Service
 *
 * يدير ربط وإلغاء ربط حسابات OAuth (Google/LinkedIn/Facebook) بالحساب الحالي.
 */

export type OAuthProvider = 'google' | 'linkedin' | 'facebook';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

const PROVIDER_ID_FIELDS: Record<
  OAuthProvider,
  'googleId' | 'linkedinId' | 'facebookId'
> = {
  google: 'googleId',
  linkedin: 'linkedinId',
  facebook: 'facebookId',
};

export interface LinkedProvidersResult {
  google: { linked: boolean; email?: string };
  linkedin: { linked: boolean; email?: string };
  facebook: { linked: boolean; email?: string };
  quicksign: { available: boolean; email: string };
  canUnlinkGoogle: boolean;
  canUnlinkLinkedin: boolean;
  canUnlinkFacebook: boolean;
}

export interface LinkingStatePayload {
  userId: string;
  provider: OAuthProvider;
  createdAt: number;
}

@Injectable()
export class AccountLinkingService {
  private readonly LINKING_STATE_TTL = 600; // 10 minutes
  private readonly LINKING_STATE_PREFIX = 'account_link:';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private securityLogService: SecurityLogService,
    private redis: RedisService,
  ) {}

  async getLinkedProviders(userId: string): Promise<LinkedProvidersResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        googleId: true,
        linkedinId: true,
        facebookId: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const hasQuickSign = user.emailVerified;

    return {
      google: {
        linked: !!user.googleId,
        email: user.googleId ? user.email : undefined,
      },
      linkedin: {
        linked: !!user.linkedinId,
        email: user.linkedinId ? user.email : undefined,
      },
      facebook: {
        linked: !!user.facebookId,
        email: user.facebookId ? user.email : undefined,
      },
      quicksign: {
        available: hasQuickSign,
        email: user.email,
      },
      canUnlinkGoogle:
        !!user.googleId &&
        (!!user.linkedinId || !!user.facebookId || hasQuickSign),
      canUnlinkLinkedin:
        !!user.linkedinId &&
        (!!user.googleId || !!user.facebookId || hasQuickSign),
      canUnlinkFacebook:
        !!user.facebookId &&
        (!!user.googleId || !!user.linkedinId || hasQuickSign),
    };
  }

  async initiateLinking(
    userId: string,
    provider: OAuthProvider,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleId: true, linkedinId: true, facebookId: true },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const idField = PROVIDER_ID_FIELDS[provider];
    if (user[idField]) {
      throw new ConflictException(
        `حساب ${PROVIDER_LABELS[provider]} مربوط بالفعل`,
      );
    }

    const stateToken = crypto.randomBytes(32).toString('hex');
    const key = `${this.LINKING_STATE_PREFIX}${stateToken}`;

    const payload: LinkingStatePayload = {
      userId,
      provider,
      createdAt: Date.now(),
    };

    await this.redis.setex(
      key,
      this.LINKING_STATE_TTL,
      JSON.stringify(payload),
    );

    return stateToken;
  }

  async completeLinking(
    stateToken: string,
    providerData: {
      providerId: string;
      email: string;
      name?: string;
      avatar?: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; provider: OAuthProvider }> {
    const key = `${this.LINKING_STATE_PREFIX}${stateToken}`;
    const rawPayload = await this.redis.get<string>(key);

    if (!rawPayload) {
      throw new BadRequestException(
        'انتهت صلاحية طلب الربط. يرجى المحاولة مرة أخرى.',
      );
    }

    await this.redis.del(key);

    const payload: LinkingStatePayload = JSON.parse(rawPayload);
    const { userId, provider } = payload;
    const providerLabel = PROVIDER_LABELS[provider];

    const existingUser = await this.findUserByProviderId(
      provider,
      providerData.providerId,
    );

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException(
        `حساب ${providerLabel} هذا مربوط بحساب آخر بالفعل.`,
      );
    }

    const idField = PROVIDER_ID_FIELDS[provider];
    await this.prisma.user.update({
      where: { id: userId },
      data: { [idField]: providerData.providerId },
      select: { id: true },
    });

    await this.securityLogService.createLog({
      userId,
      action: 'PROVIDER_LINKED' as any,
      status: 'SUCCESS',
      description: `تم ربط حساب ${providerLabel} بنجاح`,
      ipAddress,
      userAgent,
      metadata: { provider, providerEmail: providerData.email },
    });

    return { success: true, provider };
  }

  async unlinkProvider(
    userId: string,
    provider: OAuthProvider,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    const canUnlink = await this.canUnlink(userId, provider);
    if (!canUnlink) {
      throw new ForbiddenException(
        'لا يمكن إلغاء ربط آخر طريقة تسجيل دخول. أضف طريقة أخرى أولاً.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleId: true, linkedinId: true, facebookId: true },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const idField = PROVIDER_ID_FIELDS[provider];
    if (!user[idField]) {
      throw new BadRequestException(
        `حساب ${PROVIDER_LABELS[provider]} غير مربوط`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { [idField]: null },
      select: { id: true },
    });

    await this.securityLogService.createLog({
      userId,
      action: 'PROVIDER_UNLINKED' as any,
      status: 'WARNING',
      description: `تم إلغاء ربط حساب ${PROVIDER_LABELS[provider]}`,
      ipAddress,
      userAgent,
      metadata: { provider },
    });

    return { success: true };
  }

  private async findUserByProviderId(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<{ id: string } | null> {
    const idField = PROVIDER_ID_FIELDS[provider];
    return this.prisma.user.findUnique({
      where: { [idField]: providerId } as any,
      select: { id: true },
    });
  }

  private async canUnlink(
    userId: string,
    provider: OAuthProvider,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleId: true,
        linkedinId: true,
        facebookId: true,
        emailVerified: true,
      },
    });

    if (!user) return false;

    let methodCount = 0;
    if (user.googleId) methodCount++;
    if (user.linkedinId) methodCount++;
    if (user.facebookId) methodCount++;
    if (user.emailVerified) methodCount++;

    return methodCount > 1;
  }

  async validateLinkingState(
    stateToken: string,
  ): Promise<LinkingStatePayload | null> {
    const key = `${this.LINKING_STATE_PREFIX}${stateToken}`;
    const rawPayload = await this.redis.get<string>(key);
    if (!rawPayload) return null;
    return JSON.parse(rawPayload);
  }
}
