import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CacheManager } from '../../../core/cache/cache.manager';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { AccountLockoutService } from '../../auth/account-lockout.service';
import { EmailService } from '../../../integrations/email/email.service';
import { WhatsappService } from '../../../integrations/whatsapp/whatsapp.service';
import { WhatsAppBusinessService } from '../../../integrations/whatsapp-business/whatsapp-business.service';
import { SecurityLogService } from '../../../infrastructure/security/log.service';

export interface UsersListFilters {
  search?: string;
  role?: string;
  emailVerified?: string;
  startDate?: string;
  endDate?: string;
  verificationLevel?: string;
  isRuknyVerified?: string;
  twoFactorEnabled?: string;
  phoneVerified?: string;
  isDeactivated?: string;
}

export interface AdminNotificationChannels {
  inApp?: boolean;
  email?: boolean;
  whatsapp?: boolean;
}

export interface AdminNotificationDelivery {
  success: boolean;
  delivered: {
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  errors: {
    email?: string;
    whatsapp?: string;
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheManager,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly accountLockoutService: AccountLockoutService,
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsappService,
    private readonly whatsappBusinessService: WhatsAppBusinessService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  private buildUsersWhere(filters: UsersListFilters) {
    const where: any = {};

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { profile: { name: { contains: search, mode: 'insensitive' } } },
        { profile: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (filters.role) where.role = filters.role;
    if (filters.emailVerified !== undefined && filters.emailVerified !== '') {
      where.emailVerified = filters.emailVerified === 'true';
    }
    if (filters.verificationLevel !== undefined && filters.verificationLevel !== '') {
      where.verificationLevel = Number(filters.verificationLevel);
    }
    if (filters.isRuknyVerified !== undefined && filters.isRuknyVerified !== '') {
      where.isRuknyVerified = filters.isRuknyVerified === 'true';
    }
    if (filters.twoFactorEnabled !== undefined && filters.twoFactorEnabled !== '') {
      where.twoFactorEnabled = filters.twoFactorEnabled === 'true';
    }
    if (filters.phoneVerified !== undefined && filters.phoneVerified !== '') {
      where.phoneVerified = filters.phoneVerified === 'true';
    }
    if (filters.isDeactivated !== undefined && filters.isDeactivated !== '') {
      where.isDeactivated = filters.isDeactivated === 'true';
    }
    if (filters.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }

    return where;
  }

  private async logAdminAction(
    userId: string,
    adminId: string,
    description: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.securityLogService.createLog({
      userId,
      action: 'SECURITY_SETTINGS_CHANGED' as any,
      status: 'SUCCESS',
      description,
      metadata: { source: 'hq_admin', adminId, ...metadata },
    });
  }

  async getStats() {
    return this.cache.wrap('admin:users-stats', 120, async () => {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE "createdAt" >= $1)::int AS today,
          COUNT(*) FILTER (WHERE "createdAt" >= $2)::int AS this_week,
          COUNT(*) FILTER (WHERE "createdAt" >= $3)::int AS this_month,
          COUNT(*) FILTER (WHERE role = 'ADMIN')::int AS admin_count,
          COUNT(*) FILTER (WHERE role = 'PREMIUM')::int AS premium_count,
          COUNT(*) FILTER (WHERE role = 'BASIC')::int AS basic_count,
          COUNT(*) FILTER (WHERE role = 'GUEST')::int AS guest_count,
          COUNT(*) FILTER (WHERE "emailVerified" = true)::int AS verified,
          COUNT(*) FILTER (WHERE "profileCompleted" = true)::int AS profile_completed,
          COUNT(*) FILTER (WHERE "twoFactorEnabled" = true)::int AS two_factor_enabled,
          COUNT(*) FILTER (WHERE "lastLoginAt" >= $1)::int AS active_today
        FROM users
      `,
        todayStart,
        weekStart,
        monthStart,
      );

      const r = rows[0];
      const total = r.total;
      const verified = r.verified;

      return {
        total,
        today: r.today,
        thisWeek: r.this_week,
        thisMonth: r.this_month,
        byRole: {
          admin: r.admin_count,
          premium: r.premium_count,
          basic: r.basic_count,
          guest: r.guest_count,
        },
        verified,
        profileCompleted: r.profile_completed,
        twoFactorEnabled: r.two_factor_enabled,
        activeToday: r.active_today,
        verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      };
    });
  }

  async getUsers(
    query: UsersListFilters & { page: number; limit: number },
  ) {
    const { page, limit, ...filters } = query;
    const skip = (page - 1) * limit;
    const where = this.buildUsersWhere(filters);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          profileCompleted: true,
          twoFactorEnabled: true,
          phoneNumber: true,
          phoneVerified: true,
          verificationLevel: true,
          isRuknyVerified: true,
          isDeactivated: true,
          lastLoginAt: true,
          createdAt: true,
          accountType: true,
          googleId: true,
          profile: { select: { name: true, username: true, avatar: true } },
          subscription: { select: { plan: true, status: true } },
          _count: {
            select: {
              events: true,
              forms: true,
              orders: true,
              sessions: true,
              posts: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        profileCompleted: u.profileCompleted,
        twoFactorEnabled: u.twoFactorEnabled,
        phoneNumber: u.phoneNumber,
        phoneVerified: u.phoneVerified,
        verificationLevel: u.verificationLevel,
        isRuknyVerified: u.isRuknyVerified,
        isDeactivated: u.isDeactivated,
        subscriptionPlan: u.subscription?.plan ?? 'FREE',
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        accountType: u.accountType,
        hasGoogle: !!u.googleId,
        name: u.profile?.name ?? null,
        username: u.profile?.username ?? null,
        avatar: u.profile?.avatar ?? null,
        eventsCount: u._count.events,
        formsCount: u._count.forms,
        ordersCount: u._count.orders,
        sessionsCount: u._count.sessions,
        postsCount: u._count.posts,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        profile: { include: { socialLinks: true } },
        sessions: {
          where: { isRevoked: false },
          orderBy: { lastActivity: 'desc' },
          take: 10,
        },
        stores: {
          select: { id: true, name: true, slug: true, logo: true, status: true },
        },
        securityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            events: true,
            forms: true,
            orders: true,
            sessions: true,
            posts: true,
            stores: true,
            followers: true,
            following: true,
            reviews: true,
            comments: true,
            files: true,
          },
        },
      },
    });

    const primaryStore = user.stores[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      profileCompleted: user.profileCompleted,
      twoFactorEnabled: user.twoFactorEnabled,
      phoneNumber: user.phoneNumber ?? undefined,
      phoneVerified: user.phoneVerified,
      accountType: user.accountType,
      hasGoogle: !!user.googleId,
      hasLinkedin: !!user.linkedinId,
      hasTelegram: !!(user.telegramChatId || user.telegramUsername),
      telegramUsername: user.telegramUsername ?? undefined,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      verificationLevel: user.verificationLevel,
      isRuknyVerified: user.isRuknyVerified,
      ruknyVerifiedAt: user.ruknyVerifiedAt?.toISOString() ?? null,
      isDeactivated: user.isDeactivated,
      deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile: user.profile
        ? {
            id: user.profile.id,
            name: user.profile.name,
            username: user.profile.username,
            avatar: user.profile.avatar ?? undefined,
            coverImage: user.profile.coverImage ?? undefined,
            bio: user.profile.bio ?? undefined,
            visibility: user.profile.visibility,
            storageUsed: Number(user.profile.storageUsed),
            storageLimit: Number(user.profile.storageLimit),
          }
        : null,
      store: primaryStore
        ? {
            id: primaryStore.id,
            name: primaryStore.name,
            slug: primaryStore.slug,
            logo: primaryStore.logo ?? undefined,
            status: primaryStore.status,
          }
        : null,
      sessions: user.sessions.map((session) => ({
        id: session.id,
        deviceName: session.deviceName ?? undefined,
        deviceType: session.deviceType ?? undefined,
        browser: session.browser ?? undefined,
        os: session.os ?? undefined,
        ipAddress: session.ipAddress ?? undefined,
        location: session.location ?? undefined,
        lastActivity: session.lastActivity.toISOString(),
        createdAt: session.createdAt.toISOString(),
      })),
      securityLogs: user.securityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        status: log.status,
        description: log.description ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        browser: log.browser ?? undefined,
        os: log.os ?? undefined,
        createdAt: log.createdAt.toISOString(),
      })),
      counts: {
        events: user._count.events,
        forms: user._count.forms,
        orders: user._count.orders,
        posts: user._count.posts,
        sessions: user._count.sessions,
        followers: user._count.followers,
        following: user._count.following,
        reviews: user._count.reviews,
        comments: user._count.comments,
        files: user._count.files,
      },
    };
  }

  async updateUserRole(id: string, role: string, adminId?: string) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
    if (adminId) {
      await this.logAdminAction(id, adminId, `Role changed to ${role}`, {
        type: 'role_change',
        role,
      });
    }
    return updated;
  }

  async deactivateUser(id: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isDeactivated) {
      throw new BadRequestException('Account is already deactivated');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isDeactivated: true, deactivatedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: id, isRevoked: false },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Account deactivated by admin',
        },
      }),
    ]);

    await this.logAdminAction(
      id,
      adminId,
      reason?.trim() || 'Account deactivated by admin',
      { type: 'deactivate' },
    );

    return { success: true, message: 'Account deactivated' };
  }

  async reactivateUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isDeactivated) {
      throw new BadRequestException('Account is not deactivated');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isDeactivated: false, deactivatedAt: null },
    });

    await this.logAdminAction(id, adminId, 'Account reactivated by admin', {
      type: 'reactivate',
    });

    return { success: true, message: 'Account reactivated' };
  }

  async getUserAdminNotes(userId: string) {
    const logs = await this.prisma.securityLog.findMany({
      where: {
        userId,
        metadata: { path: ['type'], equals: 'admin_note' },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        description: true,
        createdAt: true,
        metadata: true,
      },
    });

    return logs.map((log) => ({
      id: log.id,
      note: log.description ?? '',
      adminId: (log.metadata as any)?.adminId ?? null,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async addUserAdminNote(userId: string, adminId: string, note: string) {
    const trimmed = note?.trim();
    if (!trimmed) throw new BadRequestException('Note is required');

    await this.logAdminAction(userId, adminId, trimmed, {
      type: 'admin_note',
    });

    return { success: true, message: 'Note added' };
  }

  async getUserAdminActivity(userId: string) {
    const logs = await this.prisma.securityLog.findMany({
      where: {
        userId,
        metadata: { path: ['source'], equals: 'hq_admin' },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        action: true,
        status: true,
        description: true,
        metadata: true,
        createdAt: true,
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      status: log.status,
      description: log.description ?? '',
      adminId: (log.metadata as any)?.adminId ?? null,
      type: (log.metadata as any)?.type ?? 'action',
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async deleteUserSessions(id: string, adminId?: string) {
    const result = await this.prisma.session.updateMany({
      where: { userId: id, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Admin revoked all sessions',
      },
    });
    if (adminId) {
      await this.logAdminAction(id, adminId, 'All sessions revoked by admin', {
        type: 'revoke_sessions',
      });
    }
    return result;
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async sendUserNotification(
    id: string,
    title: string,
    message: string,
    adminId: string,
    channels: AdminNotificationChannels = {},
  ): Promise<AdminNotificationDelivery> {
    const sendInApp = channels.inApp !== false;
    const sendEmail = channels.email !== false;
    const sendWhatsapp = channels.whatsapp !== false;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        phone: true,
        phoneVerified: true,
        profile: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    const delivery: AdminNotificationDelivery = {
      success: false,
      delivered: { inApp: false, email: false, whatsapp: false },
      errors: {},
    };

    if (sendInApp) {
      await this.notificationsGateway.sendNotification({
        userId: id,
        type: 'SYSTEM',
        title: trimmedTitle,
        message: trimmedMessage,
        data: { source: 'hq_admin', adminId },
      });
      delivery.delivered.inApp = true;
    }

    if (sendEmail) {
      try {
        const sent = await this.emailService.sendEmail({
          to: user.email,
          subject: trimmedTitle,
          html: this.buildAdminNotificationEmailHtml(
            user.profile?.name,
            trimmedTitle,
            trimmedMessage,
          ),
        });
        delivery.delivered.email = sent;
        if (!sent) {
          delivery.errors.email = 'Email service is not configured';
        }
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'Failed to send email';
        delivery.errors.email = reason;
        this.logger.warn(`Admin notification email failed for ${id}: ${reason}`);
      }
    }

    if (sendWhatsapp) {
      const phone = user.phoneNumber || user.phone;
      if (!phone?.trim()) {
        delivery.errors.whatsapp = 'User has no phone number on file';
      } else {
        try {
          delivery.delivered.whatsapp = await this.sendAdminWhatsApp(
            phone,
            trimmedTitle,
            trimmedMessage,
          );
          if (!delivery.delivered.whatsapp && !delivery.errors.whatsapp) {
            delivery.errors.whatsapp = 'WhatsApp delivery failed';
          }
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'Failed to send WhatsApp';
          delivery.errors.whatsapp = reason;
          this.logger.warn(
            `Admin notification WhatsApp failed for ${id}: ${reason}`,
          );
        }
      }
    }

    delivery.success =
      delivery.delivered.inApp ||
      delivery.delivered.email ||
      delivery.delivered.whatsapp;

    return delivery;
  }

  private buildAdminNotificationEmailHtml(
    name: string | null | undefined,
    title: string,
    message: string,
  ): string {
    const greeting = name?.trim() ? `Hello ${name.trim()},` : 'Hello,';
    const safeTitle = this.escapeHtml(title);
    const safeMessage = this.escapeHtml(message).replace(/\n/g, '<br />');

    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 16px;">${greeting}</p>
        <h2 style="margin:0 0 12px;font-size:20px;">${safeTitle}</h2>
        <p style="margin:0 0 24px;">${safeMessage}</p>
        <p style="margin:0;font-size:12px;color:#666;">This message was sent by the Rukny team.</p>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async sendAdminWhatsApp(
    phone: string,
    title: string,
    message: string,
  ): Promise<boolean> {
    const text = `*${title}*\n\n${message}\n\n— Rukny`;

    if (this.whatsappService.isEnabled()) {
      const result = await this.whatsappService.sendTextMessage(phone, text);
      if (result.success) return true;
      this.logger.warn(
        `Personal WhatsApp failed for admin notification: ${result.error}`,
      );
    }

    if (this.whatsappBusinessService.isEnabled()) {
      try {
        await this.whatsappBusinessService.sendTextMessage(phone, text);
        return true;
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'WhatsApp Business failed';
        this.logger.warn(`WhatsApp Business admin notification failed: ${reason}`);
      }
    }

    if (!this.whatsappService.isEnabled() && !this.whatsappBusinessService.isEnabled()) {
      throw new Error('WhatsApp service is not configured');
    }

    return false;
  }

  async getUserLockoutStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.accountLockoutService.getLockoutStats(user.email);

    return {
      email: user.email,
      isLocked: stats.isLocked,
      lockoutUntil: stats.lockoutUntil?.toISOString() ?? null,
      lockCount: stats.lockCount,
      recentAttempts: stats.recentAttempts,
      lastAttempt: stats.lastAttempt?.toISOString() ?? null,
    };
  }

  async unlockUserAccount(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.accountLockoutService.unlockAccount(user.email, adminId);

    return { success: true, message: 'Account unlocked' };
  }

  async exportUsers(filters: UsersListFilters) {
    const where = this.buildUsersWhere(filters);

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        profileCompleted: true,
        twoFactorEnabled: true,
        phoneNumber: true,
        phoneVerified: true,
        verificationLevel: true,
        isRuknyVerified: true,
        isDeactivated: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        accountType: true,
        profile: { select: { name: true, username: true } },
        subscription: { select: { plan: true } },
        _count: {
          select: {
            orders: true,
            events: true,
            forms: true,
            posts: true,
          },
        },
      },
    });

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.profile?.name ?? '',
        username: u.profile?.username ?? '',
        role: u.role,
        emailVerified: u.emailVerified,
        profileCompleted: u.profileCompleted,
        twoFactorEnabled: u.twoFactorEnabled,
        phone: u.phoneNumber ?? '',
        phoneVerified: u.phoneVerified,
        verificationLevel: u.verificationLevel,
        isRuknyVerified: u.isRuknyVerified,
        isDeactivated: u.isDeactivated,
        subscriptionPlan: u.subscription?.plan ?? 'FREE',
        accountType: u.accountType,
        ordersCount: u._count.orders,
        eventsCount: u._count.events,
        formsCount: u._count.forms,
        postsCount: u._count.posts,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? '',
      })),
      total: users.length,
    };
  }
}
