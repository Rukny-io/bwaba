import { Injectable } from '@nestjs/common';
import { SupportTicketCategory } from '@prisma/client';
import { SupportTicketsService } from '../../support-tickets/support-tickets.service';
import { EmailEntitlementService, EMAIL_API_STARTER_MONTHLY_PRICE_IQD, EMAIL_API_STARTER_MONTHLY_QUOTA } from '../shared/email-entitlement.service';

@Injectable()
export class EmailBillingService {
  constructor(
    private readonly entitlements: EmailEntitlementService,
    private readonly supportTickets: SupportTicketsService,
  ) {}

  getSummary(userId: string) {
    return this.entitlements.getSummary(userId);
  }

  async requestStarter(userId: string) {
    const ticket = await this.supportTickets.createTicket(userId, {
      subject: 'طلب اشتراك Email API Starter',
      description: [
        'طلب تفعيل اشتراك Email API Starter.',
        '',
        `السعر الشهري: ${EMAIL_API_STARTER_MONTHLY_PRICE_IQD.toLocaleString('en-IQ')} IQD`,
        `الحصة الشهرية: ${EMAIL_API_STARTER_MONTHLY_QUOTA.toLocaleString('en-IQ')} رسالة`,
        '',
        'Email API Starter subscription activation request.',
      ].join('\n'),
      category: SupportTicketCategory.BILLING,
      context: { kind: 'email_api_subscription', product: 'email', plan: 'STARTER', locale: 'ar' },
    });
    return { ticketId: ticket.id, ticketNumber: ticket.number };
  }

  activateStarter(userId: string, periodEndsAt?: Date) {
    return this.entitlements.activateStarter(userId, periodEndsAt);
  }
}
