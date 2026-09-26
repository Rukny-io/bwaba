import { Test, TestingModule } from '@nestjs/testing';
import { DeveloperEmailPlan } from '@prisma/client';
import { EmailBillingService } from './email-billing.service';
import { EmailEntitlementService } from '../shared/email-entitlement.service';
import { SupportTicketsService } from '../../support-tickets/support-tickets.service';
import { WalletService } from '../../developer/wallet/wallet.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { EMAIL_API_OVERAGE_PACK } from './email-api-plan-limits.config';

describe('EmailBillingService', () => {
  let service: EmailBillingService;
  const entitlements = {
    getSummary: jest.fn(),
    getSummaryByPublicAppId: jest.fn(),
    creditOveragePack: jest.fn(),
    activatePlan: jest.fn(),
    activateMarketingPlan: jest.fn(),
    ensureEntitlement: jest.fn(),
    resolveOwnedApp: jest.fn(),
  };
  const supportTickets = { createTicket: jest.fn() };
  const wallet = { getWallet: jest.fn() };
  const prisma = { $transaction: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailBillingService,
        { provide: EmailEntitlementService, useValue: entitlements },
        { provide: SupportTicketsService, useValue: supportTickets },
        { provide: WalletService, useValue: wallet },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(EmailBillingService);
  });

  it('returns public plan catalog', () => {
    const plans = service.getPlans();
    expect(plans.transactional.length).toBe(3);
    expect(plans.marketing.length).toBeGreaterThan(3);
    expect(plans.overagePack).toEqual(EMAIL_API_OVERAGE_PACK);

    const pro50k = plans.transactional.find((plan) => plan.id === 'PRO_50K');
    const pro100k = plans.transactional.find((plan) => plan.id === 'PRO_100K');
    expect(pro50k).toMatchObject({
      marketingNameEn: 'Growth',
      priceMonthlyIqd: 16_000,
      overagePer1kIqd: 1_000,
    });
    expect(pro100k).toMatchObject({
      marketingNameEn: 'Enterprise',
      priceMonthlyIqd: 130_000,
      overagePer1kIqd: 1_000,
    });
  });

  it('creates support ticket for plan request', async () => {
    entitlements.resolveOwnedApp.mockResolvedValue({
      id: 'app_internal_1',
      appId: '1234567890123456',
    });
    supportTickets.createTicket.mockResolvedValue({ id: 't1', number: '100' });
    const result = await service.requestPlan(
      'user_1',
      '1234567890123456',
      DeveloperEmailPlan.PRO_50K,
    );
    expect(result.ticketNumber).toBe('100');
    expect(supportTickets.createTicket).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({
        subject: expect.stringContaining('نمو'),
        description: expect.stringContaining('Email API Growth'),
        context: expect.objectContaining({
          plan: DeveloperEmailPlan.PRO_50K,
          publicAppId: '1234567890123456',
        }),
      }),
    );
  });
});
