import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MailAppMemberRole,
  MailMailboxStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  MailAppAccessService,
  type MailAppAccess,
} from './mail-app-access.service';
import { MailMailboxSessionService } from './mail-mailbox-session.service';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import {
  AssignMailMailboxDto,
  ChangeMailMailboxPasswordDto,
  ConfirmMailMailbox2faDto,
  CreateMailMailboxDto,
  SetMailMailbox2faDto,
  UnlockMailMailboxDto,
  UpdateMailMailboxDto,
} from './dto/mail-mailbox.dto';
import { assertMailboxDisplayName } from './mail-display-name.util';

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
    private readonly access: MailAppAccessService,
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

  private toView(
    row: {
      id: string;
      localPart: string;
      domain: string;
      displayName: string | null;
      avatarKey?: string | null;
      passwordHash: string | null;
      totpEnabled: boolean;
      assignedUserId?: string | null;
      storageUsedBytes?: bigint | number;
      status: MailMailboxStatus;
      createdAt: Date;
      updatedAt: Date;
      mailApp: { appId: string };
    },
    opts?: { canSsoUnlock?: boolean },
  ) {
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
      assignedUserId: row.assignedUserId ?? null,
      canSsoUnlock: Boolean(opts?.canSsoUnlock),
      storageUsedBytes: Number.isFinite(used) ? used : 0,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async requireManageAccess(userId: string, appId: string) {
    const access = await this.access.requireAccess(userId, appId);
    if (!this.access.canManageMailboxes(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_MANAGE_REQUIRED',
        message: 'You cannot manage mailboxes in this workspace.',
      });
    }
    return access;
  }

  private async requireManagedMailbox(
    userId: string,
    appId: string,
    mailboxId: string,
  ) {
    const access = await this.requireManageAccess(userId, appId);
    const existing = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: access.app.id,
        status: { not: MailMailboxStatus.DELETED },
      },
      include: { mailApp: { select: { appId: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Mailbox not found.');
    }
    return { access, mailbox: existing };
  }

  private viewForUser(
    userId: string,
    access: MailAppAccess,
    row: Parameters<MailMailboxesService['toView']>[0],
  ) {
    return this.toView(row, {
      canSsoUnlock: this.access.canSsoSelectForUser(userId, access, {
        assignedUserId: row.assignedUserId ?? null,
      }),
    });
  }

  async list(userId: string, appId: string) {
    const access = await this.access.requireAccess(userId, appId);
    const where: Prisma.MailMailboxWhereInput = {
      mailAppId: access.app.id,
      status: { not: MailMailboxStatus.DELETED },
    };
    if (!access.isOwner && access.role !== MailAppMemberRole.ADMIN) {
      where.assignedUserId = userId;
    }
    const rows = await this.prisma.mailMailbox.findMany({
      where,
      include: { mailApp: { select: { appId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return {
      mailboxes: rows.map((row) => this.viewForUser(userId, access, row)),
    };
  }

  async create(userId: string, appId: string, dto: CreateMailMailboxDto) {
    const { app } = await this.requireManageAccess(userId, appId);
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
    const displayName = assertMailboxDisplayName(dto.displayName);

    const limits = await this.subscriptions.getActiveLimitsForApp(app.id);
    if (!limits || typeof limits.mailboxCount !== 'number') {
      throw new BadRequestException(
        'This workspace needs an active plan before you can create mailboxes. Starter starts after DNS is verified.',
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
        `Mailbox limit reached for this workspace (${limits.mailboxCount}). Request more seats.`,
      );
    }

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
          // New seats default to the creator for Rukny SSO unlock.
          assignedUserId: userId,
          status: MailMailboxStatus.ACTIVE,
        },
        include: { mailApp: { select: { appId: true } } },
      });
      const access = await this.access.requireAccess(userId, appId);
      return { mailbox: this.viewForUser(userId, access, created) };
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
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );

    const data: Prisma.MailMailboxUpdateInput = {};
    if (dto.displayName !== undefined) {
      data.displayName = assertMailboxDisplayName(dto.displayName ?? '');
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

    return { mailbox: this.viewForUser(userId, access, updated) };
  }

  async assign(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: AssignMailMailboxDto,
  ) {
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
    if (!access.isOwner && access.role !== MailAppMemberRole.ADMIN) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_ASSIGN_FORBIDDEN',
        message: 'Only owners or admins can assign mailboxes.',
      });
    }

    let assignedUserId: string | null = null;
    if (dto.userId) {
      if (dto.userId === access.app.userId) {
        assignedUserId = dto.userId;
      } else {
        const member = await this.prisma.mailAppMember.findUnique({
          where: {
            mailAppId_userId: {
              mailAppId: access.app.id,
              userId: dto.userId,
            },
          },
        });
        if (member?.status !== InvitationStatus.ACCEPTED) {
          throw new BadRequestException(
            'Assign only to the owner or an accepted team member.',
          );
        }
        assignedUserId = dto.userId;
      }
    }

    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { assignedUserId },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.viewForUser(userId, access, updated) };
  }

  async changePassword(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: ChangeMailMailboxPasswordDto,
  ) {
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
    this.assertPassword(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { passwordHash },
      include: { mailApp: { select: { appId: true } } },
    });
    await this.mailboxSessions.revokeMailbox(existing.id);
    return { mailbox: this.viewForUser(userId, access, updated) };
  }

  async set2fa(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: SetMailMailbox2faDto,
  ): Promise<{
    mailbox: ReturnType<MailMailboxesService['toView']>;
    setup?: MailMailboxTotpSetup;
  }> {
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
    const address = `${existing.localPart}@${existing.domain}`;

    if (!dto.enabled) {
      const updated = await this.prisma.mailMailbox.update({
        where: { id: existing.id },
        data: { totpEnabled: false, totpSecret: null },
        include: { mailApp: { select: { appId: true } } },
      });
      await this.mailboxSessions.revokeMailbox(existing.id);
      return { mailbox: this.viewForUser(userId, access, updated) };
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
      mailbox: this.viewForUser(userId, access, updated),
      setup: await this.totpSetupPayload(address, secret),
    };
  }

  async confirm2fa(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: ConfirmMailMailbox2faDto,
  ) {
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
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
    return { mailbox: this.viewForUser(userId, access, updated) };
  }

  async unlock(userId: string, appId: string, dto: UnlockMailMailboxDto) {
    const access = await this.access.requireAccess(userId, appId);
    const address = dto.address.trim().toLowerCase();
    const at = address.lastIndexOf('@');
    if (at < 1) {
      throwMailboxLoginFailed('Email or password is incorrect.');
    }
    const localPart = address.slice(0, at);
    const domain = address.slice(at + 1);

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        mailAppId: access.app.id,
        localPart,
        domain,
        status: MailMailboxStatus.ACTIVE,
      },
      include: { mailApp: { select: { appId: true } } },
    });

    if (!mailbox?.passwordHash) {
      throwMailboxLoginFailed('Email or password is incorrect.');
    }

    // Non-admins may only unlock their assigned seat (or any with password if owner/admin).
    if (
      !access.isOwner &&
      access.role !== MailAppMemberRole.ADMIN &&
      mailbox.assignedUserId !== userId
    ) {
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

    const view = this.viewForUser(userId, access, mailbox);
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
    const access = await this.access.requireAccess(userId, appId);
    const session = await this.mailboxSessions.read(token);
    if (
      !session ||
      session.userId !== userId ||
      session.appId !== appId
    ) {
      return { mailbox: null };
    }
    try {
      const mailbox = await this.prisma.mailMailbox.findFirst({
        where: {
          id: session.mailboxId,
          mailAppId: access.app.id,
          status: { not: MailMailboxStatus.DELETED },
        },
        include: { mailApp: { select: { appId: true } } },
      });
      if (!mailbox || mailbox.status !== MailMailboxStatus.ACTIVE) {
        return { mailbox: null };
      }
      return { mailbox: this.viewForUser(userId, access, mailbox) };
    } catch {
      return { mailbox: null };
    }
  }

  /** Open webmail via Rukny SSO (no mailbox password). */
  async select(userId: string, appId: string, mailboxId: string) {
    const access = await this.access.requireAccess(userId, appId);
    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: access.app.id,
        status: { not: MailMailboxStatus.DELETED },
      },
      include: { mailApp: { select: { appId: true } } },
    });
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found.');
    }
    if (mailbox.status !== MailMailboxStatus.ACTIVE) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAILBOX_DISABLED',
        message: 'This mailbox is disabled.',
      });
    }
    if (!this.access.canSsoSelectForUser(userId, access, mailbox)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAILBOX_SSO_FORBIDDEN',
        message: 'This mailbox is not assigned to your account.',
      });
    }
    const view = this.viewForUser(userId, access, mailbox);
    const token = await this.mailboxSessions.create({
      userId,
      appId,
      mailboxId: mailbox.id,
      address: view.address,
    });
    return { mailbox: view, token };
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
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
    const key = await this.storage.uploadMailMailboxAvatar(
      access.app.userId,
      appId,
      existing.id,
      file,
    );
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { avatarKey: key },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.viewForUser(userId, access, updated) };
  }

  async removeAvatar(userId: string, appId: string, mailboxId: string) {
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
    await this.storage.deleteMailMailboxAvatar(access.app.userId, existing.id);
    const updated = await this.prisma.mailMailbox.update({
      where: { id: existing.id },
      data: { avatarKey: null },
      include: { mailApp: { select: { appId: true } } },
    });
    return { mailbox: this.viewForUser(userId, access, updated) };
  }

  async remove(userId: string, appId: string, mailboxId: string) {
    const { access, mailbox: existing } = await this.requireManagedMailbox(
      userId,
      appId,
      mailboxId,
    );
    await this.storage
      .deleteMailMailboxAvatar(access.app.userId, existing.id)
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
      data: {
        status: MailMailboxStatus.DELETED,
        avatarKey: null,
        // Free @@unique([domain, localPart]) so the address can be created again.
        localPart: `deleted.${existing.id}.${existing.localPart}`.slice(0, 191),
      },
    });
    await this.mailboxSessions.revokeMailbox(existing.id);
    return { ok: true };
  }
}
