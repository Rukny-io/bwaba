import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailMailboxStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailMailboxSessionService } from './mail-mailbox-session.service';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import {
  ChangeMailMailboxPasswordDto,
  ConfirmMailMailbox2faDto,
  CreateMailMailboxDto,
  SetMailMailbox2faDto,
  UnlockMailMailboxDto,
  UpdateMailMailboxDto,
} from './dto/mail-mailbox.dto';

const BCRYPT_ROUNDS = 10;
const TOTP_ISSUER = 'Rukny Mail';

function throwMailboxLoginFailed(message: string): never {
  throw new ForbiddenException({
    statusCode: 403,
    code: 'MAILBOX_LOGIN_FAILED',
    message,
  });
}

export type MailMailboxTotpSetup = {
  qrCodeUrl: string;
  manualEntryKey: string;
};

@Injectable()
export class MailMailboxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: MailSubscriptionsService,
    private readonly storage: StorageService,
    private readonly mailboxSessions: MailMailboxSessionService,
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

  /** otplib base32 secret. Legacy hex secrets cannot be verified. */
  private isUsableTotpSecret(secret: string | null | undefined) {
    if (!secret) return false;
    const compact = secret.replace(/\s/g, '').toUpperCase();
    return /^[A-Z2-7]{16,}$/.test(compact);
  }

  private verifyTotp(secret: string, token: string) {
    const cleanToken = token.replace(/\s/g, '');
    const result = verifySync({
      token: cleanToken,
      secret,
      epochTolerance: 30,
    });
    return result.valid;
  }

  private async totpSetupPayload(address: string, secret: string): Promise<MailMailboxTotpSetup> {
    const otpauthUrl = generateURI({
      issuer: TOTP_ISSUER,
      label: address,
      secret,
    });
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
    return { qrCodeUrl, manualEntryKey: secret };
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

    const aliasTaken = await this.prisma.mailAlias.findFirst({
      where: { domain, localPart },
      select: { id: true },
    });
    if (aliasTaken) {
      throw new BadRequestException(`${localPart}@${domain} already exists.`);
    }

    try {
      const created = await this.prisma.mailMailbox.create({
        data: {
          mailAppId: app.id,
          localPart,
          domain,
          displayName,
          passwordHash,
          totpEnabled: false,
          totpSecret: null,
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

    if (dto.status === 'DISABLED') {
      await this.prisma.mailCatchAll.updateMany({
        where: { mailboxId: existing.id, enabled: true },
        data: { enabled: false },
      });
      await this.prisma.mailAutoReply.updateMany({
        where: { mailboxId: existing.id, enabled: true },
        data: { enabled: false },
      });
      await this.prisma.mailAlias.updateMany({
        where: { mailboxId: existing.id, enabled: true },
        data: { enabled: false },
      });
      await this.prisma.mailForwarder.updateMany({
        where: { mailboxId: existing.id, enabled: true },
        data: { enabled: false },
      });
      await this.mailboxSessions.revokeMailbox(existing.id);
    }

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
    await this.mailboxSessions.revokeMailbox(existing.id);
    return { mailbox: this.toView(updated) };
  }

  async set2fa(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: SetMailMailbox2faDto,
  ): Promise<{ mailbox: ReturnType<MailMailboxesService['toView']>; setup?: MailMailboxTotpSetup }> {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    const address = `${existing.localPart}@${existing.domain}`;

    if (!dto.enabled) {
      const updated = await this.prisma.mailMailbox.update({
        where: { id: existing.id },
        data: { totpEnabled: false, totpSecret: null },
        include: { mailApp: { select: { appId: true } } },
      });
      await this.mailboxSessions.revokeMailbox(existing.id);
      return { mailbox: this.toView(updated) };
    }

    if (existing.totpEnabled && this.isUsableTotpSecret(existing.totpSecret)) {
      throw new BadRequestException('Two-factor authentication is already on.');
    }

    const secret =
      this.isUsableTotpSecret(existing.totpSecret) && !existing.totpEnabled
        ? existing.totpSecret!
        : generateSecret();

    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { totpEnabled: false, totpSecret: secret },
      include: { mailApp: { select: { appId: true } } },
    });

    return {
      mailbox: this.toView(updated),
      setup: await this.totpSetupPayload(address, secret),
    };
  }

  async confirm2fa(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: ConfirmMailMailbox2faDto,
  ) {
    const existing = await this.requireOwnedMailbox(userId, appId, mailboxId);
    if (!existing.totpSecret || !this.isUsableTotpSecret(existing.totpSecret)) {
      throw new BadRequestException('Start two-factor setup first.');
    }
    if (existing.totpEnabled) {
      throw new BadRequestException('Two-factor authentication is already on.');
    }
    if (!this.verifyTotp(existing.totpSecret, dto.code)) {
      throw new BadRequestException(
        'That code is incorrect. Try a new code from the app.',
      );
    }
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { totpEnabled: true },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.toView(updated) };
  }

  async unlock(userId: string, appId: string, dto: UnlockMailMailboxDto) {
    const app = await this.requireOwnedApp(userId, appId);
    const address = dto.address.trim().toLowerCase();
    const at = address.lastIndexOf('@');
    if (at < 1) {
      throwMailboxLoginFailed('Email or password is incorrect.');
    }
    const localPart = address.slice(0, at);
    const domain = address.slice(at + 1);

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        mailAppId: app.id,
        localPart,
        domain,
        status: MailMailboxStatus.ACTIVE,
      },
      include: { mailApp: { select: { appId: true } } },
    });

    if (!mailbox?.passwordHash) {
      throwMailboxLoginFailed('Email or password is incorrect.');
    }

    const passwordOk = await bcrypt.compare(dto.password, mailbox.passwordHash);
    if (!passwordOk) {
      throwMailboxLoginFailed('Email or password is incorrect.');
    }

    const totpReady =
      mailbox.totpEnabled && this.isUsableTotpSecret(mailbox.totpSecret);

    if (totpReady && !dto.totp) {
      return {
        needsTotp: true as const,
        address: `${mailbox.localPart}@${mailbox.domain}`,
      };
    }

    if (totpReady && dto.totp && !this.verifyTotp(mailbox.totpSecret!, dto.totp)) {
      throwMailboxLoginFailed(
        'That code is incorrect. Try a new code from the app.',
      );
    }

    const view = this.toView(mailbox);
    const token = await this.mailboxSessions.create({
      userId,
      appId,
      mailboxId: mailbox.id,
      address: view.address,
    });

    return {
      needsTotp: false as const,
      mailbox: view,
      token,
    };
  }

  async session(userId: string, appId: string, token: string | undefined) {
    await this.requireOwnedApp(userId, appId);
    const session = await this.mailboxSessions.read(token);
    if (
      !session ||
      session.userId !== userId ||
      session.appId !== appId
    ) {
      return { mailbox: null };
    }
    try {
      const mailbox = await this.requireOwnedMailbox(
        userId,
        appId,
        session.mailboxId,
      );
      if (mailbox.status !== MailMailboxStatus.ACTIVE) {
        return { mailbox: null };
      }
      return { mailbox: this.toView(mailbox) };
    } catch {
      return { mailbox: null };
    }
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
    await this.prisma.mailCatchAll.deleteMany({
      where: { mailboxId: existing.id },
    });
    await this.prisma.mailAutoReply.deleteMany({
      where: { mailboxId: existing.id },
    });
    await this.prisma.mailAlias.deleteMany({
      where: { mailboxId: existing.id },
    });
    await this.prisma.mailForwarder.deleteMany({
      where: { mailboxId: existing.id },
    });
    await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { status: MailMailboxStatus.DELETED, avatarKey: null },
    });
    await this.mailboxSessions.revokeMailbox(existing.id);
    return { ok: true };
  }
}
