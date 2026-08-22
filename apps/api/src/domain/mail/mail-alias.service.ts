import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailMailboxStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  CreateMailAliasDto,
  UpdateMailAliasDto,
} from './dto/mail-alias.dto';
import { MailSubscriptionsService } from './mail-subscriptions.service';

@Injectable()
export class MailAliasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: MailSubscriptionsService,
  ) {}

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return app;
  }

  private normalizeLocalPart(raw: string) {
    return raw.trim().toLowerCase();
  }

  private async aliasLimit(mailAppUuid: string) {
    const limits = await this.subscriptions.getActiveLimitsForApp(mailAppUuid);
    return Number(limits?.limits?.emailAliases) || 0;
  }

  private toView(row: {
    id: string;
    localPart: string;
    domain: string;
    mailboxId: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    mailbox: { localPart: string; domain: string; status: MailMailboxStatus };
  }) {
    return {
      id: row.id,
      localPart: row.localPart,
      domain: row.domain,
      address: `${row.localPart}@${row.domain}`,
      mailboxId: row.mailboxId,
      mailboxAddress: `${row.mailbox.localPart}@${row.mailbox.domain}`,
      enabled: row.enabled && row.mailbox.status === MailMailboxStatus.ACTIVE,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const [limit, rows] = await Promise.all([
      this.aliasLimit(app.id),
      this.prisma.mailAlias.findMany({
        where: { mailAppId: app.id },
        include: {
          mailbox: {
            select: { localPart: true, domain: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      domain: app.primaryDomain,
      limit,
      used: rows.length,
      aliases: rows.map((row) => this.toView(row)),
    };
  }

  async create(userId: string, appId: string, dto: CreateMailAliasDto) {
    const app = await this.requireOwnedApp(userId, appId);
    const domain = app.primaryDomain?.trim().toLowerCase() || null;
    if (!domain) {
      throw new BadRequestException(
        'Connect and verify a domain before creating aliases.',
      );
    }

    const localPart = this.normalizeLocalPart(dto.localPart);
    if (!localPart) {
      throw new BadRequestException('Enter an alias name.');
    }

    const limit = await this.aliasLimit(app.id);
    const used = await this.prisma.mailAlias.count({
      where: { mailAppId: app.id },
    });
    if (used >= limit) {
      throw new BadRequestException(
        `Alias limit reached for this app (${limit}). Upgrade your plan for more aliases.`,
      );
    }

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: dto.mailboxId,
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (!mailbox) {
      throw new BadRequestException('Mailbox not found or inactive.');
    }

    if (mailbox.localPart === localPart && mailbox.domain === domain) {
      throw new BadRequestException(
        'Choose a different address than the mailbox itself.',
      );
    }

    const mailboxTaken = await this.prisma.mailMailbox.findFirst({
      where: { domain, localPart },
      select: { id: true },
    });
    if (mailboxTaken) {
      throw new BadRequestException(`${localPart}@${domain} already exists.`);
    }

    try {
      const row = await this.prisma.mailAlias.create({
        data: {
          mailAppId: app.id,
          mailboxId: mailbox.id,
          localPart,
          domain,
          enabled: true,
        },
        include: {
          mailbox: {
            select: { localPart: true, domain: true, status: true },
          },
        },
      });
      return { alias: this.toView(row) };
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
    aliasId: string,
    dto: UpdateMailAliasDto,
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailAlias.findFirst({
      where: { id: aliasId, mailAppId: app.id },
    });
    if (!existing) throw new NotFoundException('Alias not found.');

    let mailboxId = existing.mailboxId;
    if (dto.mailboxId) {
      const mailbox = await this.prisma.mailMailbox.findFirst({
        where: {
          id: dto.mailboxId,
          mailAppId: app.id,
          status: MailMailboxStatus.ACTIVE,
        },
      });
      if (!mailbox) {
        throw new BadRequestException('Mailbox not found or inactive.');
      }
      if (
        mailbox.localPart === existing.localPart &&
        mailbox.domain === existing.domain
      ) {
        throw new BadRequestException(
          'Choose a different address than the mailbox itself.',
        );
      }
      mailboxId = mailbox.id;
    }

    const row = await this.prisma.mailAlias.update({
      where: { id: existing.id },
      data: {
        mailboxId,
        ...(dto.enabled === undefined ? {} : { enabled: dto.enabled }),
      },
      include: {
        mailbox: {
          select: { localPart: true, domain: true, status: true },
        },
      },
    });
    return { alias: this.toView(row) };
  }

  async remove(userId: string, appId: string, aliasId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailAlias.findFirst({
      where: { id: aliasId, mailAppId: app.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Alias not found.');
    await this.prisma.mailAlias.delete({ where: { id: existing.id } });
    return { ok: true };
  }
}
