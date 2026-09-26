import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { EmailEntitlementService } from '../shared/email-entitlement.service';

export type CreateEmailContactInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  source?: string;
};

@Injectable()
export class EmailMarketingContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EmailEntitlementService,
  ) {}

  async list(userId: string) {
    const contacts = await this.prisma.developerEmailContact.findMany({
      where: { userId, unsubscribedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return contacts.map((c) => this.publicContact(c));
  }

  async create(userId: string, input: CreateEmailContactInput) {
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new BadRequestException('Invalid email address.');
    }
    await this.entitlements.ensureEntitlement(userId);

    const emailHash = this.entitlements.hashContactEmail(email);
    const existing = await this.prisma.developerEmailContact.findUnique({
      where: { userId_emailHash: { userId, emailHash } },
    });
    if (!existing) {
      await this.reserveContactSlot(userId);
    }

    const contact = await this.prisma.developerEmailContact.upsert({
      where: { userId_emailHash: { userId, emailHash } },
      create: {
        userId,
        email,
        emailHash,
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        tags: input.tags ?? [],
        source: input.source ?? 'manual',
      },
      update: {
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        tags: input.tags,
        unsubscribedAt: null,
      },
    });
    return this.publicContact(contact);
  }

  async importFromForms(userId: string, emails: string[]) {
    const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()))].filter(
      (e) => e.includes('@'),
    );
    let imported = 0;
    for (const email of unique) {
      try {
        await this.create(userId, { email, source: 'forms' });
        imported += 1;
      } catch {
        // skip duplicates / quota errors per address
      }
    }
    return { imported, requested: unique.length };
  }

  async unsubscribe(userId: string, email: string) {
    const emailHash = this.entitlements.hashContactEmail(email);
    const contact = await this.prisma.developerEmailContact.findUnique({
      where: { userId_emailHash: { userId, emailHash } },
    });
    if (!contact) throw new NotFoundException('Contact not found.');
    await this.prisma.developerEmailContact.update({
      where: { id: contact.id },
      data: { unsubscribedAt: new Date() },
    });
    return { success: true };
  }

  private async reserveContactSlot(userId: string) {
    const entitlement = await this.prisma.developerEmailEntitlement.findUnique({
      where: { userId },
    });
    if (!entitlement) {
      throw new BadRequestException('Email entitlement not found.');
    }
    if (entitlement.marketingContactsUsed >= entitlement.marketingContactsLimit) {
      throw new BadRequestException(
        'Marketing contacts limit reached. Upgrade your marketing plan.',
      );
    }
    await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data: { marketingContactsUsed: { increment: 1 } },
    });
  }

  private publicContact(contact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tags: string[];
    source: string;
    createdAt: Date;
  }) {
    return {
      id: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      tags: contact.tags,
      source: contact.source,
      createdAt: contact.createdAt.toISOString(),
    };
  }
}
