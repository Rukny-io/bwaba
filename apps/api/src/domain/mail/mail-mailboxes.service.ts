import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailMailboxStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
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

  private toView(row: {
    id: string;
    localPart: string;
    domain: string;
    displayName: string | null;
    passwordHash: string | null;
    totpEnabled: boolean;
    status: MailMailboxStatus;
    createdAt: Date;
    updatedAt: Date;
    mailApp: { appId: string };
  }) {
    return {
      id: row.id,
      appId: row.mailApp.appId,
      localPart: row.localPart,
      domain: row.domain,
      address: `${row.localPart}@${row.domain}`,
      displayName: row.displayName,
      hasPassword: Boolean(row.passwordHash),
      totpEnabled: row.totpEnabled,
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

    const limits = await this.subscriptions.getActiveLimits(userId);
    if (!limits || typeof limits.mailboxCount !== 'number') {
      throw new BadRequestException(
        'An active Mail subscription is required to create mailboxes.',
      );
    }

    const usedSeats = await this.prisma.mailMailbox.count({
      where: {
        status: MailMailboxStatus.ACTIVE,
        mailApp: { userId, status: MailAppStatus.ACTIVE },
      },
    });
    if (usedSeats >= limits.mailboxCount) {
      throw new BadRequestException(
        `Mailbox limit reached (${limits.mailboxCount}). Upgrade your plan or add seats.`,
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

  async remove(userId: string, appId: string, mailboxId: string) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { status: MailMailboxStatus.DELETED },
    });
    return { ok: true };
  }
}
