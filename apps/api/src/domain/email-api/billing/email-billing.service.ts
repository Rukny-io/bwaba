import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeveloperEmailMarketingPlan,
  DeveloperEmailPlan,
  SupportTicketCategory,
} from '@prisma/client';
import { SupportTicketsService } from '../../support-tickets/support-tickets.service';
import { WalletService } from '../../developer/wallet/wallet.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import {
  EMAIL_API_ADDONS,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_OVERAGE_PACK,
  EMAIL_API_TRANSACTIONAL_PLANS,
  DeveloperEmailMarketingPlanId,
  DeveloperEmailPlanId,
  getEmailApiMarketingPlan,
  getEmailApiPlan,
} from './email-api-plan-limits.config';
import {
  EmailEntitlementService,
  EMAIL_API_STARTER_MONTHLY_PRICE_IQD,
  EMAIL_API_STARTER_MONTHLY_QUOTA,
} from '../shared/email-entitlement.service';

@Injectable()
export class EmailBillingService {
  constructor(
    private readonly entitlements: EmailEntitlementService,
    private readonly supportTickets: SupportTicketsService,
    private readonly wallet: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  getSummary(userId: string) {
    return this.entitlements.getSummary(userId);
  }

  getPlans() {
    return {
      transactional: EMAIL_API_TRANSACTIONAL_PLANS,
      marketing: EMAIL_API_MARKETING_PLANS,
      overagePack: EMAIL_API_OVERAGE_PACK,
      addons: EMAIL_API_ADDONS,
      annualDiscountPercent: 17,
    };
  }

  async requestPlan(userId: string, plan: DeveloperEmailPlan) {
    const planDef = getEmailApiPlan(plan);
    if (!planDef.selfServe) {
      throw new BadRequestException('Contact sales for Enterprise pricing.');
    }

    const ticket = await this.supportTickets.createTicket(userId, {
      subject: `طلب اشتراك ${planDef.invoiceLabelAr}`,
      description: [
        `طلب تفعيل ${planDef.invoiceLabelAr}.`,
        '',
        `السعر الشهري: ${planDef.priceMonthlyIqd.toLocaleString('en-IQ')} IQD`,
        `الحصة الشهرية: ${planDef.monthlyQuota.toLocaleString('en-IQ')} رسالة`,
        '',
        `${planDef.invoiceLabelEn} subscription activation request.`,
      ].join('\n'),
      category: SupportTicketCategory.BILLING,
      context: {
        kind: 'email_api_subscription',
        product: 'email',
        plan,
        locale: 'ar',
      },
    });
    return { ticketId: ticket.id, ticketNumber: ticket.number };
  }

  /** @deprecated Use requestPlan */
  requestStarter(userId: string) {
    return this.requestPlan(userId, DeveloperEmailPlan.PRO_10K);
  }

  activatePlan(
    userId: string,
    plan: DeveloperEmailPlan,
    periodEndsAt?: Date,
    enterpriseMonthlyQuota?: number,
  ) {
    return this.entitlements.activatePlan(
      userId,
      plan as DeveloperEmailPlanId,
      periodEndsAt,
      enterpriseMonthlyQuota,
    );
  }

  /** @deprecated Use activatePlan */
  activateStarter(userId: string, periodEndsAt?: Date) {
    return this.activatePlan(userId, DeveloperEmailPlan.PRO_10K, periodEndsAt);
  }

  async purchaseOverage(userId: string, packs: number) {
    const n = Math.max(1, Math.floor(packs));
    const totalIqd = n * EMAIL_API_OVERAGE_PACK.priceIqd;
    const emails = n * EMAIL_API_OVERAGE_PACK.emails;

    const wallet = await this.wallet.getWallet(userId);
    if (wallet.balance < totalIqd) {
      throw new BadRequestException('Insufficient wallet balance for overage pack.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.developerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: totalIqd },
          totalSpent: { increment: totalIqd },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EMAIL_OVERAGE_PACK',
          amount: totalIqd,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - totalIqd,
          status: 'COMPLETED',
          description: `Email API overage ${emails.toLocaleString('en-IQ')} messages`,
          referenceType: 'email_api_overage',
          metadata: {
            packs: n,
            emails,
            priceIqd: totalIqd,
          },
        },
      });
    });

    await this.entitlements.creditOveragePack(userId, emails);
    return this.getSummary(userId);
  }

  activateMarketingPlan(userId: string, plan: DeveloperEmailMarketingPlan) {
    const planDef = getEmailApiMarketingPlan(plan);
    if (!planDef.selfServe) {
      throw new BadRequestException('Contact sales for Enterprise marketing.');
    }
    return this.entitlements.activateMarketingPlan(
      userId,
      plan as DeveloperEmailMarketingPlanId,
    );
  }

  async requestMarketingPlan(userId: string, plan: DeveloperEmailMarketingPlan) {
    const planDef = getEmailApiMarketingPlan(plan);
    const ticket = await this.supportTickets.createTicket(userId, {
      subject: `طلب Email Marketing ${planDef.name}`,
      description: [
        `Marketing contacts plan: ${planDef.name}`,
        `Contacts limit: ${planDef.contactsLimit.toLocaleString('en-IQ')}`,
        `Monthly price: ${planDef.priceMonthlyIqd.toLocaleString('en-IQ')} IQD`,
      ].join('\n'),
      category: SupportTicketCategory.BILLING,
      context: {
        kind: 'email_api_marketing',
        product: 'email',
        plan,
      },
    });
    return { ticketId: ticket.id, ticketNumber: ticket.number };
  }

  async updateAddons(
    userId: string,
    input: {
      domainsExtraPacks?: number;
      dedicatedIpEnabled?: boolean;
      ssoEnabled?: boolean;
    },
  ) {
    await this.entitlements.ensureEntitlement(userId);
    const updated = await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data: {
        addonDomainsExtra:
          input.domainsExtraPacks != null
            ? Math.max(0, Math.floor(input.domainsExtraPacks))
            : undefined,
        dedicatedIpEnabled: input.dedicatedIpEnabled,
        ssoEnabled: input.ssoEnabled,
      },
    });
    if (!updated) throw new NotFoundException('Entitlement not found');
    return this.getSummary(userId);
  }

  async requestEnterprise(userId: string, volumeMonthly?: number) {
    const ticket = await this.supportTickets.createTicket(userId, {
      subject: 'طلب Email API Enterprise',
      description: [
        'Enterprise Email API request.',
        volumeMonthly
          ? `Estimated volume: ${volumeMonthly.toLocaleString('en-IQ')} emails/month`
          : 'Custom volume requested.',
      ].join('\n'),
      category: SupportTicketCategory.BILLING,
      context: {
        kind: 'email_api_enterprise',
        product: 'email',
        volumeMonthly: volumeMonthly ?? null,
      },
    });
    return { ticketId: ticket.id, ticketNumber: ticket.number };
  }
}

export {
  EMAIL_API_STARTER_MONTHLY_PRICE_IQD,
  EMAIL_API_STARTER_MONTHLY_QUOTA,
};
