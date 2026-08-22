import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailMailboxStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import {
  ChangeMailMailboxPasswordDto,
  CreateMailMailboxDto,
  SetMailMailbox2faDto,
  UpdateMailMailboxDto,
} from './dto/mail-mailbox.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class MailMailboxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: MailSubscriptionsService,
    private readonly storage: StorageService,
  ) {}

  private normalizeLocalPart(raw: string) {
    return raw.trim().toLowerCase();
  }

  private normalizeDomain(raw: string) {
    return raw.trim().toLowerCase().replace(/\.$/, '');
  }

  private assertPassword(password: string) {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
    if (password.length > 128) {
      throw new BadRequestException('Password is too long.');
    }
  }

  /** Base32-ish secret for future TOTP enrollment (not exposed in list). */
  private generateTotpSecret() {
    return randomBytes(20).toString('hex');
  }

  private mediaUrl(key: string | null | undefined) {
    if (!key) return null;
    const cleaned = key.replace(/^\/+/, '');
    if (!cleaned || cleaned.includes('..')) return null;
    return `/api/media/${cleaned}`;
  }

  private toView(row: {
    id: string;
    localPart: string;
    domain: string;
    displayName: string | null;
    avatarKey?: string | null;
    passwordHash: string | null;
    totpEnabled: boolean;
    storageUsedBytes?: bigint | number;
    status: MailMailboxStatus;
    createdAt: Date;
    updatedAt: Date;
    mailApp: { appId: string };
  }) {
    const used =
      typeof row.storageUsedBytes === 'bigint'
        ? Number(row.storageUsedBytes)
        : Number(row.storageUsedBytes ?? 0);
    return {
      id: row.id,
      appId: row.mailApp.appId,
      localPart: row.localPart,
      domain: row.domain,
      address: `${row.localPart}@${row.domain}`,
      displayName: row.displayName,
      avatarUrl: this.mediaUrl(row.avatarKey),
      hasPassword: Boolean(row.passwordHash),
      totpEnabled: row.totpEnabled,
      storageUsedBytes: Number.isFinite(used) ? used : 0,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) {
      throw new NotFoundException('Mail app not found.');
    }
    return app;
  }

  private async requireOwnedMailbox(
    userId: string,
    appId: string,
    mailboxId: string,
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
      },
      include: { mailApp: { select: { appId: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Mailbox not found.');
    }
    return existing;
  }

  async list(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const rows = await this.prisma.mailMailbox.findMany({
      where: {
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
      },
      include: { mailApp: { select: { appId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return { mailboxes: rows.map((row) => this.toView(row)) };
  }

  async create(userId: string, appId: string, dto: CreateMailMailboxDto) {
    const app = await this.requireOwnedApp(userId, appId);
    const domain = app.primaryDomain
      ? this.normalizeDomain(app.primaryDomain)
      : null;
    if (!domain) {
      throw new BadRequestException(
        'Connect and verify a domain before creating mailboxes.',
      );
    }

    const localPart = this.normalizeLocalPart(dto.localPart);
    if (!localPart) {
      throw new BadRequestException('Enter a mailbox name.');
    }

    this.assertPassword(dto.password);

    const limits = await this.subscriptions.getActiveLimitsForApp(app.id);
    if (!limits || typeof limits.mailboxCount !== 'number') {
      throw new BadRequestException(
        'This Mail app needs an active plan before you can create mailboxes. Request a plan from Pricing.',
      );
    }

    const usedSeats = await this.prisma.mailMailbox.count({
      where: {
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (usedSeats >= limits.mailboxCount) {
      throw new BadRequestException(
        `Mailbox limit reached for this app (${limits.mailboxCount}). Request more seats.`,
      );
    }

    const displayName =
      dto.displayName?.trim() ||
      localPart.charAt(0).toUpperCase() + localPart.slice(1);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const enable2fa = Boolean(dto.enable2fa);

    try {
      const created = await this.prisma.mailMailbox.create({
        data: {
          mailAppId: app.id,
          localPart,
          domain,
          displayName,
          passwordHash,
          totpEnabled: enable2fa,
          totpSecret: enable2fa ? this.generateTotpSecret() : null,
          status: MailMailboxStatus.ACTIVE,
        },
        include: { mailApp: { select: { appId: true } } },
      });
      return { mailbox: this.toView(created) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `${localPart}@${domain} already exists.`,
        );
      }
      throw error;
    }
  }

  async update(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: UpdateMailMailboxDto,
  ) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);

    const data: Prisma.MailMailboxUpdateInput = {};
    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName?.trim() || null;
    }
    if (dto.status) {
      data.status =
        dto.status === 'DISABLED'
          ? MailMailboxStatus.DISABLED
          : MailMailboxStatus.ACTIVE;
    }

    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data,
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.toView(updated) };
  }

  async changePassword(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: ChangeMailMailboxPasswordDto,
  ) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    this.assertPassword(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { passwordHash },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.toView(updated) };
  }

  async set2fa(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: SetMailMailbox2faDto,
  ) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: {
        totpEnabled: dto.enabled,
        totpSecret: dto.enabled
          ? existing.totpSecret || this.generateTotpSecret()
          : null,
      },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.toView(updated) };
  }

  async uploadAvatar(
    userId: string,
    appId: string,
    mailboxId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    const key = await this.storage.uploadMailMailboxAvatar(
      userId,
      appId,
      existing.id,
      file,
    );
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { avatarKey: key },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.toView(updated) };
  }

  async removeAvatar(userId: string, appId: string, mailboxId: string) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    await this.storage.deleteMailMailboxAvatar(userId, existing.id);
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { avatarKey: null },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.toView(updated) };
  }

  async remove(userId: string, appId: string, mailboxId: string) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    await this.storage
      .deleteMailMailboxAvatar(userId, existing.id)
      .catch(() => undefined);
    await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { status: MailMailboxStatus.DELETED, avatarKey: null },
    });
    return { ok: true };
  }
}
