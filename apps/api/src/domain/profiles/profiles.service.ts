import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CacheManager } from '../../core/cache/cache.manager';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { S3Service } from '../../shared/services/s3.service';
import { RedisService } from '../../core/cache/redis.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import { SupportTicketsService } from '../support-tickets/support-tickets.service';
import { normalizePhoneNumber } from '../forms/utils/form-phone-verification-check.util';
import * as crypto from 'crypto';

const PHONE_CHANGE_MAX_PER_WINDOW = 2;
const PHONE_CHANGE_WINDOW_SECONDS = 30 * 24 * 60 * 60; // 30 days
const PHONE_IN_USE_MESSAGE =
  'رقم الهاتف مرتبط بحساب آخر. إذا كان هذا رقمك، تواصل مع الدعم الفني عبر صفحة الدعم في حسابك.';
const PHONE_CLAIM_TICKET_DEDUPE_SECONDS = 7 * 24 * 60 * 60;
const PHONE_CHANGE_LIMIT_MESSAGE =
  'تجاوزت الحد المسموح لتغيير رقم الهاتف (مرتان كل 30 يوماً). تواصل مع الدعم الفني إذا كنت بحاجة للمساعدة.';

@Injectable()
export class ProfilesService {
  private readonly bucket = process.env.S3_BUCKET || 'rukny-storage';
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private readonly cacheManager: CacheManager,
    private readonly redisService: RedisService,
    private readonly whatsappBusiness: WhatsAppBusinessService,
    private readonly supportTicketsService: SupportTicketsService,
  ) {}

  private phoneClaimTicketKey(userId: string, phone: string): string {
    return `phone_claim_ticket:${userId}:${phone}`;
  }

  private async raisePhoneAlreadyClaimed(
    userId: string,
    phone: string,
    existingOwnerUserId: string,
  ): Promise<never> {
    const dedupeKey = this.phoneClaimTicketKey(userId, phone);
    let ticketNumber =
      (await this.redisService.get<string>(dedupeKey)) ?? undefined;

    if (!ticketNumber) {
      try {
        const ticket =
          await this.supportTicketsService.createPhoneClaimDisputeTicket(
            userId,
            phone,
            existingOwnerUserId,
          );
        ticketNumber = ticket.number;
        await this.redisService.set(
          dedupeKey,
          ticketNumber,
          PHONE_CLAIM_TICKET_DEDUPE_SECONDS,
        );
      } catch (error) {
        this.logger.warn(
          `Phone claim ticket failed for ${userId}: ${(error as Error).message}`,
        );
      }
    }

    const message = ticketNumber
      ? `${PHONE_IN_USE_MESSAGE} تم فتح تذكرة دعم تلقائياً برقم ${ticketNumber} — تابعها من صفحة الدعم.`
      : PHONE_IN_USE_MESSAGE;

    throw new ConflictException({
      message,
      code: 'PHONE_ALREADY_CLAIMED',
      ticketNumber,
    });
  }

  private async assertPhoneAvailable(
    phone: string,
    userId: string,
  ): Promise<void> {
    const taken = await this.prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [{ phone }, { phoneNumber: phone }],
      },
      select: { id: true },
    });
    if (taken) {
      await this.raisePhoneAlreadyClaimed(userId, phone, taken.id);
    }
  }

  private async getCurrentUserPhone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneNumber: true },
    });
    return normalizePhoneNumber(user?.phone || user?.phoneNumber || '');
  }

  private phoneChangeLimitKey(userId: string): string {
    return `phone_change_count:${userId}`;
  }

  /** يُطبَّق فقط عند تغيير رقم مُتحقَّق مسبقاً — الإضافة الأولى مسموحة */
  private async assertPhoneChangeAllowed(
    userId: string,
    newPhone: string,
  ): Promise<void> {
    const currentPhone = await this.getCurrentUserPhone(userId);
    if (!currentPhone || currentPhone === newPhone) {
      return;
    }

    const changes =
      (await this.redisService.get<number>(this.phoneChangeLimitKey(userId))) ||
      0;
    if (changes >= PHONE_CHANGE_MAX_PER_WINDOW) {
      throw new BadRequestException(PHONE_CHANGE_LIMIT_MESSAGE);
    }
  }

  private async recordPhoneChange(userId: string, previousPhone: string) {
    if (!previousPhone) return;

    const key = this.phoneChangeLimitKey(userId);
    const changes = (await this.redisService.get<number>(key)) || 0;
    await this.redisService.set(key, changes + 1, PHONE_CHANGE_WINDOW_SECONDS);
    this.logger.log(
      `Phone changed for user ${userId}: ${previousPhone.slice(0, 6)}***`,
    );
  }

  private async invalidateUserProfileCache(userId: string, username?: string) {
    await this.redisService.del(`user:profile:${userId}`);
    if (username) {
      await this.cacheManager.invalidate(`profile:username:${username}`);
      await this.cacheManager.invalidate(`profile:username:v2:${username}`);
    }
  }

  /**
   * Helper to serialize BigInt fields to numbers for JSON response
   */
  private serializeProfile<
    T extends { storageUsed?: bigint | number; storageLimit?: bigint | number },
  >(profile: T): T & { storageUsed: number; storageLimit: number } {
    return {
      ...profile,
      storageUsed: Number(profile.storageUsed || 0),
      storageLimit: Number(profile.storageLimit || 0),
    };
  }

  /**
   * Convert heroSettings logoCloud S3 keys to presigned URLs
   */
  private extractS3KeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      let key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

      // Handle path-style URLs: /bucket/key
      if (key.startsWith(`${this.bucket}/`)) {
        key = key.slice(this.bucket.length + 1);
      }

      return key || null;
    } catch {
      return null;
    }
  }

  private async resolveLogoUrls(heroSettings: any): Promise<any> {
    if (!heroSettings?.logoCloud?.logos?.length) return heroSettings;
    try {
      const logos = heroSettings.logoCloud.logos;
      const resolvedLogos = logos.map((logo: any) => {
        const keyFromLogoKey =
          typeof logo?.key === 'string' &&
          logo.key &&
          !logo.key.startsWith('http')
            ? logo.key
            : null;
        const keyFromSrc =
          typeof logo?.src === 'string' &&
          logo.src &&
          !logo.src.startsWith('http')
            ? logo.src
            : null;
        const keyFromS3Url =
          typeof logo?.src === 'string' && logo.src.startsWith('http')
            ? this.extractS3KeyFromUrl(logo.src)
            : null;

        const sourceKey = keyFromLogoKey || keyFromSrc || keyFromS3Url;

        if (sourceKey) {
          return { ...logo, key: sourceKey, src: `/api/media/${sourceKey}` };
        }
        return logo;
      });
      return {
        ...heroSettings,
        logoCloud: { ...heroSettings.logoCloud, logos: resolvedLogos },
      };
    } catch {
      return heroSettings;
    }
  }

  /**
   * Create a new user profile
   */
  async create(userId: string, createProfileDto: CreateProfileDto) {
    // Check if username already exists
    const existingProfile = await this.prisma.profile.findUnique({
      where: { username: createProfileDto.username },
    });

    if (existingProfile) {
      throw new ConflictException(
        `Username "${createProfileDto.username}" is already taken`,
      );
    }

    // Check if user already has a profile
    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (userProfile) {
      throw new ConflictException('User already has a profile');
    }

    // Create the profile
    const profile = await this.prisma.profile.create({
      data: {
        username: createProfileDto.username,
        bio: createProfileDto.bio,
        visibility: createProfileDto.visibility,
        name: createProfileDto.name,
        user: {
          connect: { id: userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        socialLinks: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return this.serializeProfile(profile);
  }

  /**
   * Find profile by username
   * ⚡ Performance: Cached for 5 minutes
   */
  async findByUsername(username: string, requesterId?: string) {
    const cacheKey = `profile:username:v2:${username}`;

    return this.cacheManager.wrap(cacheKey, 300, async () => {
      const profile = await this.prisma.profile.findUnique({
        where: { username },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              phoneNumber: true,
              bannerUrls: true,
              isRuknyVerified: true,
              verifiedDisplayName: true,
              verifiedCategory: true,
              verificationLevel: true,
            },
          },
          socialLinks: {
            where: { status: 'active' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!profile) {
        throw new NotFoundException(
          `Profile with username "${username}" not found`,
        );
      }

      // Don't return email if profile is private and not the owner
      if (profile.visibility === 'PRIVATE' && profile.userId !== requesterId) {
        delete profile.user.email;
      }

      const isOwner = profile.userId === requesterId;

      // Respect privacy settings for non-owners
      if (!isOwner) {
        if (profile.hideEmail) {
          delete profile.user.email;
        }
        if (profile.hidePhone) {
          delete (profile.user as { phone?: string | null }).phone;
          delete (profile.user as { phoneNumber?: string | null }).phoneNumber;
        }
      }

      const publicEmail = profile.user.email ?? null;
      const publicPhone =
        (profile.user as { phoneNumber?: string | null }).phoneNumber ||
        (profile.user as { phone?: string | null }).phone ||
        null;

      // Get follow counts separately
      const [followersCount, followingCount] = await Promise.all([
        this.prisma.follows.count({
          where: { followingId: profile.userId },
        }),
        this.prisma.follows.count({
          where: { followerId: profile.userId },
        }),
      ]);

      // Convert banner keys to stable proxy URLs
      const bannerKeys = (profile.user.bannerUrls || []).filter(
        (key: string) => key && !key.startsWith('http'),
      );
      const bannerUrls = bannerKeys.map((key: string) => `/api/media/${key}`);

      // Convert avatar and cover keys to stable proxy URLs
      let avatarUrl = (profile as any).avatar as string | undefined | null;
      let coverUrl = (profile as any).coverImage as string | undefined | null;

      // Handle legacy local paths (convert to full API URL or clear if invalid)
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

      if (avatarUrl && !avatarUrl.startsWith('http')) {
        if (avatarUrl.startsWith('/uploads/')) {
          this.logger.warn(
            `Legacy local avatar path detected for user, clearing: ${avatarUrl}`,
          );
          avatarUrl = null;
        } else if (!avatarUrl.startsWith('/api/')) {
          avatarUrl = `/api/media/${avatarUrl.replace(/^\/+/, '')}`;
        }
      }

      if (coverUrl && !coverUrl.startsWith('http')) {
        if (coverUrl.startsWith('/uploads/')) {
          this.logger.warn(
            `Legacy local cover path detected for user, clearing: ${coverUrl}`,
          );
          coverUrl = null;
        } else if (!coverUrl.startsWith('/api/')) {
          coverUrl = `/api/media/${coverUrl.replace(/^\/+/, '')}`;
        }
      }

      // Resolve logo cloud URLs in heroSettings
      const resolvedHeroSettings = await this.resolveLogoUrls(
        (profile as any).heroSettings,
      );

      // Transform response to include _count and banners at profile level
      return this.serializeProfile({
        ...profile,
        avatar: avatarUrl,
        coverImage: coverUrl,
        banners: bannerUrls,
        heroSettings: resolvedHeroSettings,
        isRuknyVerified: profile.user.isRuknyVerified,
        verifiedDisplayName: profile.user.verifiedDisplayName,
        verifiedCategory: profile.user.verifiedCategory,
        verificationLevel: profile.user.verificationLevel,
        email: publicEmail,
        phone: publicPhone,
        _count: {
          followers: followersCount,
          following: followingCount,
        },
      });
    });
  }

  /**
   * Find profile by user ID
   */
  async findByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            twoFactorEnabled: true,
            googleId: true,
            linkedinId: true,
            isDeactivated: true,
            deactivatedAt: true,
            isRuknyVerified: true,
            verifiedDisplayName: true,
            verifiedCategory: true,
            verificationLevel: true,
          },
        },
        socialLinks: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Convert avatar/cover to stable proxy URLs
    try {
      let avatarUrl = (profile as any)?.avatar;
      let coverUrl = (profile as any)?.coverImage;

      // Handle legacy local paths - clear them since files don't exist
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        if (avatarUrl.startsWith('/uploads/')) {
          this.logger.warn(
            `Legacy local avatar path detected, clearing: ${avatarUrl}`,
          );
          avatarUrl = null;
        } else if (!avatarUrl.startsWith('/api/')) {
          avatarUrl = `/api/media/${avatarUrl.replace(/^\/+/, '')}`;
        }
      }
      if (coverUrl && !coverUrl.startsWith('http')) {
        if (coverUrl.startsWith('/uploads/')) {
          this.logger.warn(
            `Legacy local cover path detected, clearing: ${coverUrl}`,
          );
          coverUrl = null;
        } else if (!coverUrl.startsWith('/api/')) {
          coverUrl = `/api/media/${coverUrl.replace(/^\/+/, '')}`;
        }
      }
      const resolvedHeroSettings = await this.resolveLogoUrls(
        (profile as any).heroSettings,
      );
      return this.serializeProfile({
        ...profile,
        avatar: avatarUrl,
        coverImage: coverUrl,
        heroSettings: resolvedHeroSettings,
        isRuknyVerified: profile.user.isRuknyVerified,
        verifiedDisplayName: profile.user.verifiedDisplayName,
        verifiedCategory: profile.user.verifiedCategory,
        verificationLevel: profile.user.verificationLevel,
      });
    } catch (e) {
      return this.serializeProfile(profile);
    }
  }

  /**
   * Update user profile
   */
  async update(userId: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please create a profile first.',
      );
    }

    if (updateProfileDto.hidePhone === false) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true, phoneNumber: true },
      });
      const hasPhone = Boolean(
        user?.phone?.trim() || user?.phoneNumber?.trim(),
      );
      if (!hasPhone) {
        throw new BadRequestException(
          'Add a phone number before showing it on your profile.',
        );
      }
    }

    // Check username uniqueness if updating username
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== profile.username
    ) {
      const existingProfile = await this.prisma.profile.findUnique({
        where: { username: updateProfileDto.username },
      });

      if (existingProfile) {
        throw new ConflictException(
          `Username "${updateProfileDto.username}" is already taken`,
        );
      }
    }

    // Update the profile
    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: updateProfileDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        socialLinks: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Invalidate cached public profile
    await this.invalidateUserProfileCache(userId, profile.username);
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== profile.username
    ) {
      await this.cacheManager.invalidate(`profile:username:${updateProfileDto.username}`);
    }

    return this.serializeProfile(updatedProfile);
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(userId: string, fileName: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please create a profile first.',
      );
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: { avatar: fileName },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await this.invalidateUserProfileCache(userId, profile.username);
    return this.serializeProfile(updatedProfile);
  }

  /**
   * Upload cover image
   */
  async uploadCover(userId: string, fileName: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please create a profile first.',
      );
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: { coverImage: fileName },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await this.invalidateUserProfileCache(userId, profile.username);
    return this.serializeProfile(updatedProfile);
  }

  /**
   * Delete user profile
   */
  async remove(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.prisma.profile.delete({
      where: { userId },
    });

    return { message: 'Profile deleted successfully' };
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    return {
      username,
      available: !profile,
    };
  }

  async sendPhoneVerificationOtp(userId: string, rawPhone: string) {
    const phone = normalizePhoneNumber(rawPhone);
    if (!phone || phone.length < 10) {
      throw new BadRequestException('رقم الهاتف غير صالح.');
    }

    await this.assertPhoneAvailable(phone, userId);
    await this.assertPhoneChangeAllowed(userId, phone);

    const redisKey = `phone_otp:${userId}`;
    const existing = await this.redisService.get<{
      otp: string;
      phone: string;
      attempts: number;
    }>(redisKey);
    if (existing && existing.phone === phone) {
      throw new BadRequestException('انتظر دقيقة قبل إعادة إرسال الرمز.');
    }

    if (!this.whatsappBusiness.isEnabled()) {
      throw new BadRequestException('خدمة واتساب غير متاحة حالياً.');
    }

    const otp = String(crypto.randomInt(100000, 999999));
    await this.whatsappBusiness.sendOtp(phone, otp);
    await this.redisService.set(redisKey, { otp, phone, attempts: 0 }, 300);

    return { success: true, message: 'تم إرسال رمز التحقق إلى واتساب.' };
  }

  async verifyPhoneOtpAndSave(userId: string, rawPhone: string, otp: string) {
    const phone = normalizePhoneNumber(rawPhone);
    const code = otp?.trim();
    if (!phone || !code) {
      throw new BadRequestException('رقم الهاتف والرمز مطلوبان.');
    }

    const redisKey = `phone_otp:${userId}`;
    const stored = await this.redisService.get<{
      otp: string;
      phone: string;
      attempts: number;
    }>(redisKey);
    if (!stored) {
      throw new BadRequestException('الرمز منتهي الصلاحية. اطلب رمزاً جديداً.');
    }
    if (stored.phone !== phone) {
      throw new BadRequestException('رقم الهاتف غير مطابق.');
    }

    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts > 5) {
      await this.redisService.del(redisKey);
      throw new BadRequestException('تجاوزت الحد المسموح. اطلب رمزاً جديداً.');
    }

    if (stored.otp !== code) {
      await this.redisService.set(redisKey, stored, 300);
      throw new BadRequestException('الرمز غير صحيح.');
    }

    await this.assertPhoneAvailable(phone, userId);

    const previousPhone = await this.getCurrentUserPhone(userId);

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          phone,
          phoneNumber: phone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });
    } catch (error) {
      const prismaCode = (error as { code?: string })?.code;
      if (prismaCode === 'P2002') {
        const owner = await this.prisma.user.findFirst({
          where: {
            id: { not: userId },
            OR: [{ phone }, { phoneNumber: phone }],
          },
          select: { id: true },
        });
        if (owner) {
          await this.raisePhoneAlreadyClaimed(userId, phone, owner.id);
        }
        throw new ConflictException({
          message: PHONE_IN_USE_MESSAGE,
          code: 'PHONE_ALREADY_CLAIMED',
        });
      }
      throw error;
    }

    if (previousPhone && previousPhone !== phone) {
      await this.recordPhoneChange(userId, previousPhone);
    }

    await this.redisService.del(redisKey);
    await this.invalidateUserProfileCache(userId);

    return { success: true, verified: true, phone };
  }
}
