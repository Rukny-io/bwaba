import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeveloperEmailAutomationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { EmailEntitlementService } from '../shared/email-entitlement.service';
import { EMAIL_API_AUTOMATION } from '../billing/email-api-plan-limits.config';
import { WalletService } from '../../developer/wallet/wallet.service';

@Injectable()
export class EmailAutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EmailEntitlementService,
    private readonly wallet: WalletService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.developerEmailAutomation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      triggerType: row.triggerType,
      actionType: row.actionType,
      status: row.status.toLowerCase(),
      runsTotal: row.runsTotal,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async create(
    userId: string,
    input: {
      name: string;
      triggerType?: string;
      actionType?: string;
      configJson?: Record<string, unknown>;
    },
  ) {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('Automation name is required.');
    await this.entitlements.ensureEntitlement(userId);
    const row = await this.prisma.developerEmailAutomation.create({
      data: {
        userId,
        name,
        triggerType: input.triggerType ?? 'webhook',
        actionType: input.actionType ?? 'send_email',
        configJson: (input.configJson ?? {}) as Prisma.InputJsonValue,
      },
    });
    return { id: row.id, name: row.name, status: row.status.toLowerCase() };
  }

  async run(userId: string, automationId: string) {
    const automation = await this.prisma.developerEmailAutomation.findFirst({
      where: { id: automationId, userId },
    });
    if (!automation) throw new NotFoundException('Automation not found.');
    if (automation.status !== DeveloperEmailAutomationStatus.ACTIVE) {
      throw new BadRequestException('Automation is not active.');
    }

    const reservation = await this.entitlements.reserveAutomationRun(userId);
    if (reservation === 'overage') {
      const wallet = await this.wallet.getWallet(userId);
      const price = EMAIL_API_AUTOMATION.overagePriceIqdPerRun;
      if (wallet.balance < price) {
        throw new BadRequestException(
          'Insufficient wallet balance for automation overage.',
        );
      }
      await this.prisma.$transaction(async (tx) => {
        await tx.developerWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: price },
            totalSpent: { increment: price },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'EMAIL_AUTOMATION_RUN',
            amount: price,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - price,
            status: 'COMPLETED',
            description: `Email automation overage run`,
            referenceId: automation.id,
            referenceType: 'email_automation',
          },
        });
      });
    }

    await this.prisma.developerEmailAutomationRun.create({
      data: {
        automationId: automation.id,
        userId,
        status: 'completed',
        billed: true,
      },
    });
    await this.prisma.developerEmailAutomation.update({
      where: { id: automation.id },
      data: { runsTotal: { increment: 1 } },
    });
    return { success: true, billed: reservation };
  }
}
