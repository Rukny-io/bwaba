import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeveloperEmailBroadcastRecipientStatus,
  DeveloperEmailBroadcastStatus,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

export type CreateBroadcastInput = {
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  contactIds?: string[];
};

@Injectable()
export class EmailMarketingBroadcastsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.developerEmailBroadcast.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.publicBroadcast(row));
  }

  async create(userId: string, input: CreateBroadcastInput) {
    const subject = input.subject?.trim();
    if (!subject) throw new BadRequestException('Subject is required.');
    if (!input.bodyHtml?.trim() && !input.bodyText?.trim()) {
      throw new BadRequestException('Provide bodyHtml or bodyText.');
    }

    const contacts =
      input.contactIds?.length
        ? await this.prisma.developerEmailContact.findMany({
            where: {
              userId,
              id: { in: input.contactIds },
              unsubscribedAt: null,
            },
          })
        : await this.prisma.developerEmailContact.findMany({
            where: { userId, unsubscribedAt: null },
            take: 500,
          });

    if (contacts.length === 0) {
      throw new BadRequestException('No subscribed contacts to send to.');
    }

    const broadcast = await this.prisma.developerEmailBroadcast.create({
      data: {
        userId,
        subject,
        bodyHtml: input.bodyHtml ?? null,
        bodyText: input.bodyText ?? null,
        status: DeveloperEmailBroadcastStatus.DRAFT,
        recipients: {
          create: contacts.map((contact) => ({
            contactId: contact.id,
            status: DeveloperEmailBroadcastRecipientStatus.PENDING,
          })),
        },
      },
    });
    return this.publicBroadcast(broadcast);
  }

  async send(userId: string, broadcastId: string) {
    const broadcast = await this.prisma.developerEmailBroadcast.findFirst({
      where: { id: broadcastId, userId },
      include: {
        recipients: {
          include: { contact: true },
        },
      },
    });
    if (!broadcast) throw new NotFoundException('Broadcast not found.');
    if (
      broadcast.status !== DeveloperEmailBroadcastStatus.DRAFT &&
      broadcast.status !== DeveloperEmailBroadcastStatus.SCHEDULED
    ) {
      throw new BadRequestException('Broadcast cannot be sent in this status.');
    }

    await this.prisma.developerEmailBroadcast.update({
      where: { id: broadcast.id },
      data: { status: DeveloperEmailBroadcastStatus.SENDING },
    });

    let sent = 0;
    let failed = 0;
    for (const recipient of broadcast.recipients) {
      if (recipient.contact.unsubscribedAt) {
        await this.prisma.developerEmailBroadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: DeveloperEmailBroadcastRecipientStatus.SKIPPED,
            errorCode: 'unsubscribed',
          },
        });
        continue;
      }
      // MVP: mark as sent — delivery wiring uses transactional pipeline later.
      await this.prisma.developerEmailBroadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: DeveloperEmailBroadcastRecipientStatus.SENT,
          sentAt: new Date(),
        },
      });
      sent += 1;
    }

    const updated = await this.prisma.developerEmailBroadcast.update({
      where: { id: broadcast.id },
      data: {
        status: DeveloperEmailBroadcastStatus.SENT,
        sentCount: sent,
        failedCount: failed,
        sentAt: new Date(),
      },
    });
    return this.publicBroadcast(updated);
  }

  private publicBroadcast(broadcast: {
    id: string;
    subject: string;
    status: DeveloperEmailBroadcastStatus;
    sentCount: number;
    failedCount: number;
    sentAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: broadcast.id,
      subject: broadcast.subject,
      status: broadcast.status.toLowerCase(),
      sentCount: broadcast.sentCount,
      failedCount: broadcast.failedCount,
      sentAt: broadcast.sentAt?.toISOString() ?? null,
      createdAt: broadcast.createdAt.toISOString(),
    };
  }
}
