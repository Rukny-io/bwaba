import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailMailboxStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { UpsertMailCatchAllDto } from './dto/mail-catch-all.dto';

@Injectable()
export class MailCatchAllService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return app;
  }

  private toView(
    row: {
      id: string;
      enabled: boolean;
      mailboxId: string;
      updatedAt: Date;
      mailbox: { localPart: string; domain: string; status: MailMailboxStatus };
    } | null,
    domain: string | null,
  ) {
    if (!row || row.mailbox.status === MailMailboxStatus.DELETED) {
      return { domain, catchAll: null };
    }
    return {
      domain,
      catchAll: {
        id: row.id,
        enabled: row.enabled,
        mailboxId: row.mailboxId,
        mailboxAddress: `${row.mailbox.localPart}@${row.mailbox.domain}`,
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  }

  async get(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const row = await this.prisma.mailCatchAll.findUnique({
      where: { mailAppId: app.id },
      include: {
        mailbox: { select: { localPart: true, domain: true, status: true } },
      },
    });
    return this.toView(row, app.primaryDomain);
  }

  async upsert(userId: string, appId: string, dto: UpsertMailCatchAllDto) {
    const app = await this.requireOwnedApp(userId, appId);
    const domain = app.primaryDomain?.trim().toLowerCase() || null;
    if (!domain) {
      throw new BadRequestException(
        'Connect and verify a domain before enabling catch-all.',
      );
    }

    const existing = await this.prisma.mailCatchAll.findUnique({
      where: { mailAppId: app.id },
    });

    if (!dto.enabled && !existing) {
      return this.toView(null, domain);
    }

    let mailboxId = dto.mailboxId || existing?.mailboxId || null;
    if (!mailboxId) {
      const first = await this.prisma.mailMailbox.findFirst({
        where: {
          mailAppId: app.id,
          status: MailMailboxStatus.ACTIVE,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      mailboxId = first?.id ?? null;
    }

    if (!mailboxId) {
      throw new BadRequestException(
        'Create a mailbox before enabling catch-all.',
      );
    }

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (!mailbox) {
      throw new BadRequestException('Mailbox not found or inactive.');
    }

    const row = await this.prisma.mailCatchAll.upsert({
      where: { mailAppId: app.id },
      create: {
        mailAppId: app.id,
        mailboxId: mailbox.id,
        enabled: dto.enabled,
      },
      update: {
        mailboxId: mailbox.id,
        enabled: dto.enabled,
      },
      include: {
        mailbox: { select: { localPart: true, domain: true, status: true } },
      },
    });

    return this.toView(row, domain);
  }
}
