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
    creditOveragePack: jest.fn(),
    activatePlan: jest.fn(),
    activateMarketingPlan: jest.fn(),
    ensureEntitlement: jest.fn(),
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
    expect(plans.transactional.length).toBeGreaterThan(5);
    expect(plans.marketing.length).toBeGreaterThan(3);
    expect(plans.overagePack).toEqual(EMAIL_API_OVERAGE_PACK);
  });

  it('creates support ticket for plan request', async () => {
    supportTickets.createTicket.mockResolvedValue({ id: 't1', number: '100' });
    const result = await service.requestPlan('user_1', DeveloperEmailPlan.PRO_50K);
    expect(result.ticketNumber).toBe('100');
    expect(supportTickets.createTicket).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({
        context: expect.objectContaining({ plan: DeveloperEmailPlan.PRO_50K }),
      }),
    );
  });
});
