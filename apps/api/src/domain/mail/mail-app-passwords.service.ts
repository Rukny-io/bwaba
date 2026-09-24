import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { MailMailboxStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailAppAccessService } from './mail-app-access.service';
import { CreateMailAppPasswordDto } from './dto/mail-app-password.dto';

const BCRYPT_ROUNDS = 12;
const MAX_APP_PASSWORDS_PER_MAILBOX = 10;

@Injectable()
export class MailAppPasswordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MailAppAccessService,
  ) {}

  async list(userId: string, appId: string, mailboxId: string) {
    await this.requireMailboxAccess(userId, appId, mailboxId);
    const rows = await this.prisma.mailAppPassword.findMany({
      where: { mailboxId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return {
      passwords: rows.map((row) => ({
        id: row.id,
        label: row.label,
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async create(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: CreateMailAppPasswordDto,
  ) {
    await this.requireMailboxAccess(userId, appId, mailboxId);
    const activeCount = await this.prisma.mailAppPassword.count({
      where: { mailboxId, revokedAt: null },
    });
    if (activeCount >= MAX_APP_PASSWORDS_PER_MAILBOX) {
      throw new BadRequestException(
        `You can have at most ${MAX_APP_PASSWORDS_PER_MAILBOX} active app passwords per mailbox.`,
      );
    }

    const secret = this.generateSecret();
    const secretHash = await bcrypt.hash(secret, BCRYPT_ROUNDS);
    const row = await this.prisma.mailAppPassword.create({
      data: {
        mailboxId,
        label: dto.label.trim(),
        secretHash,
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return {
      password: {
        id: row.id,
        label: row.label,
        createdAt: row.createdAt.toISOString(),
        secret,
      },
    };
  }

  async revoke(
    userId: string,
    appId: string,
    mailboxId: string,
    passwordId: string,
  ) {
    await this.requireMailboxAccess(userId, appId, mailboxId);
    const row = await this.prisma.mailAppPassword.findFirst({
      where: { id: passwordId, mailboxId, revokedAt: null },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('App password not found.');
    }
    await this.prisma.mailAppPassword.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    return { ok: true as const };
  }

  private async requireMailboxAccess(
    userId: string,
    appId: string,
    mailboxId: string,
  ) {
    const access = await this.access.requireAccess(userId, appId);
    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: access.app.id,
        status: { not: MailMailboxStatus.DELETED },
      },
      select: { id: true },
    });
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found.');
    }
    return mailbox;
  }

  private generateSecret(): string {
    const raw = randomBytes(24).toString('base64url');
    return `ruap_${raw}`;
  }

  /** Used by SMTP auth — constant-time lookup by mailbox address. */
  hashForLookup(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}
