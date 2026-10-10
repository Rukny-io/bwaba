import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import { UpdateAutoRechargeDto, UpdateLowBalanceAlertDto } from './dto/wallet.dto';

/**
 * تسعير الرسائل حسب فئة المحادثة (IQD) — العراق
 * التكلفة ≈ سعر Meta عبر YCloud (بدون markup) × ~1500 IQD/$
 * البيع = تكلفة + هامش Rukny
 *
 * AUTH/UTILITY Meta ≈ $0.0079 (~12 IQD) → بيع 16 (Rukny OTP launch price)
 * MARKETING Meta ≈ $0.0341 (~51 IQD) → بيع 70
 * SERVICE: أول 1000/رقم/شهر مجاناً من Meta
 */
export const MESSAGE_PRICING: Record<string, number> = {
  AUTHENTICATION: 16,
  UTILITY: 20,
  MARKETING: 70,
  SERVICE: 0,
  REFERRAL_CONVERSION: 0,
};

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * الحصول على/إنشاء محفظة المطوّر
   */
  async getWallet(userId: string) {
    return this.prisma.developerWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getAppWallet(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: 'ACTIVE' },
      select: { id: true, appId: true, name: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const wallet = await this.prisma.developerAppWallet.upsert({
      where: { developerAppId: app.id },
      create: { developerAppId: app.id },
      update: {},
    });

    return {
      id: wallet.id,
      appId: app.appId,
      appName: app.name,
      balance: wallet.balance,
      currency: wallet.currency,
      totalAllocated: wallet.totalAllocated,
      totalSpent: wallet.totalSpent,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async allocateToApp(userId: string, appId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const [masterWallet, appWallet] = await Promise.all([
      this.getWallet(userId),
      this.getAppWallet(userId, appId),
    ]);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Conditional debit is the balance check.  Do not split a stale read
      // from the debit: concurrent allocations must not overdraw the wallet.
      const debited = await tx.developerWallet.updateMany({
        where: { id: masterWallet.id, balance: { gte: amount } },
        data: {
          balance: { decrement: amount },
        },
      });
      if (debited.count !== 1) {
        throw new BadRequestException('Insufficient main wallet balance');
      }
      const debitedWallet = await tx.developerWallet.findUniqueOrThrow({
        where: { id: masterWallet.id },
        select: { balance: true },
      });
      const balanceBefore = debitedWallet.balance + amount;

      await tx.walletTransaction.create({
        data: {
          walletId: masterWallet.id,
          type: 'APP_ALLOCATION',
          amount,
          balanceBefore,
          balanceAfter: debitedWallet.balance,
          status: 'COMPLETED',
          description: `Transfer to app ${appWallet.appName}`,
          referenceId: appWallet.id,
          referenceType: 'app_wallet',
          metadata: {
            appId: appWallet.appId,
            appName: appWallet.appName,
          },
        },
      });

      const updatedAppWallet = await tx.developerAppWallet.update({
        where: { id: appWallet.id },
        data: {
          balance: { increment: amount },
          totalAllocated: { increment: amount },
        },
      });

      return {
        masterBalance: debitedWallet.balance,
        appBalance: updatedAppWallet.balance,
      };
    });

    await this.redis.del(`wallet:${userId}`);
    await this.redis.del(`wallet:${userId}:balance`);

    return {
      success: true,
      amount,
      masterBalance: updated.masterBalance,
      appBalance: updated.appBalance,
    };
  }

  /**
   * تأكيد الشحن بعد نجاح الدفع
   */
  async verifyTopUp(
    userId: string,
    transactionId: string,
    verifiedExternalId: string,
  ) {
    const wallet = await this.getWallet(userId);

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.findFirst({
        where: {
          id: transactionId,
          walletId: wallet.id,
          type: 'TOP_UP',
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (!transaction.externalId || transaction.externalId !== verifiedExternalId) {
        throw new BadRequestException('Payment verification does not match this top-up');
      }

      if (transaction.status === 'COMPLETED') {
        const currentWallet = await tx.developerWallet.findUnique({
          where: { id: wallet.id },
        });
        return {
          balance: currentWallet?.balance ?? wallet.balance,
          transaction,
        };
      }

      if (transaction.status !== 'PENDING') {
        throw new NotFoundException('Transaction not found or already processed');
      }

      const claimed = await tx.walletTransaction.updateMany({
        where: { id: transactionId, status: 'PENDING' },
        data: {
          status: 'COMPLETED',
        },
      });

      if (claimed.count === 0) {
        const current = await tx.walletTransaction.findUnique({
          where: { id: transactionId },
        });
        if (current?.status === 'COMPLETED') {
          const currentWallet = await tx.developerWallet.findUnique({
            where: { id: wallet.id },
          });
          return {
            balance: currentWallet?.balance ?? wallet.balance,
            transaction: current,
          };
        }
        throw new NotFoundException('Transaction not found or already processed');
      }

      const updatedWallet = await tx.developerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: transaction.amount },
          totalTopUps: { increment: transaction.amount },
        },
      });

      const updatedTransaction = await tx.walletTransaction.update({
        where: { id: transactionId },
        data: {
          balanceBefore: updatedWallet.balance - transaction.amount,
          balanceAfter: updatedWallet.balance,
        },
      });

      return {
        balance: updatedWallet.balance,
        transaction: updatedTransaction!,
      };
    });

    await this.redis.del(`wallet:${userId}`);

    this.logger.log(
      `Top-up verified: ${result.transaction.amount} IQD for user ${userId}`,
    );

    return result;
  }

  /**
   * خصم رصيد لرسالة (يُستخدم من messaging service)
   */
  async chargeMessage(
    userId: string,
    developerAppId: string,
    messageLogId: string,
    category: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const price = MESSAGE_PRICING[category] || MESSAGE_PRICING.UTILITY;

    if (price === 0) {
      return { success: true, newBalance: -1 }; // مجاني
    }

    const appWallet = await this.prisma.developerAppWallet.findUnique({
      where: { developerAppId },
      include: {
        developerApp: {
          select: { userId: true },
        },
      },
    });

    if (!appWallet || appWallet.developerApp.userId !== userId) {
      throw new NotFoundException('App wallet not found');
    }
    const masterWallet = await this.getWallet(userId);

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      const debited = await tx.developerAppWallet.updateMany({
        where: { id: appWallet.id, balance: { gte: price } },
        data: {
          balance: { decrement: price },
          totalSpent: { increment: price },
        },
      });
      if (debited.count !== 1) return null;

      const current = await tx.developerAppWallet.findUniqueOrThrow({
        where: { id: appWallet.id },
        select: { balance: true },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: masterWallet.id,
          type: 'MESSAGE_CHARGE',
          amount: price,
          balanceBefore: current.balance + price,
          balanceAfter: current.balance,
          status: 'COMPLETED',
          referenceId: messageLogId,
          referenceType: 'message',
          description: `Message charge ${category}`,
          metadata: {
            appWalletId: appWallet.id,
            developerAppId,
          },
        },
      });
      return current;
    });

    if (!updatedWallet) {
      const current = await this.prisma.developerAppWallet.findUnique({
        where: { id: appWallet.id },
        select: { balance: true },
      });
      return { success: false, newBalance: current?.balance ?? 0 };
    }

    return { success: true, newBalance: updatedWallet.balance };
  }

  /** Refund a reservation when the provider call fails before acceptance. */
  async refundMessageCharge(userId: string, messageLogId: string): Promise<void> {
    const masterWallet = await this.getWallet(userId);
    await this.prisma.$transaction(async (tx) => {
      const original = await tx.walletTransaction.findFirst({
        where: {
          walletId: masterWallet.id,
          referenceId: messageLogId,
          referenceType: 'message',
          type: 'MESSAGE_CHARGE',
          status: 'COMPLETED',
        },
      });
      if (!original) return;

      const metadata = (original.metadata ?? {}) as Record<string, unknown>;
      const appWalletId = metadata.appWalletId;
      if (typeof appWalletId !== 'string') {
        throw new BadRequestException('Message charge is missing app wallet metadata');
      }
      const claimed = await tx.walletTransaction.updateMany({
        where: { id: original.id, status: 'COMPLETED' },
        data: { status: 'REFUNDED' },
      });
      if (claimed.count !== 1) return;

      const appWallet = await tx.developerAppWallet.update({
        where: { id: appWalletId },
        data: {
          balance: { increment: original.amount },
          totalSpent: { decrement: original.amount },
        },
        select: { balance: true },
      });
      const developerAppId =
        typeof metadata.developerAppId === 'string'
          ? metadata.developerAppId
          : undefined;
      await tx.walletTransaction.create({
        data: {
          walletId: masterWallet.id,
          type: 'REFUND',
          amount: original.amount,
          balanceBefore: appWallet.balance - original.amount,
          balanceAfter: appWallet.balance,
          status: 'COMPLETED',
          referenceId: messageLogId,
          referenceType: 'message_refund',
          description: 'Refund for provider-rejected message',
          metadata: { appWalletId, ...(developerAppId ? { developerAppId } : {}) },
        },
      });
    });
  }

  /**
   * قائمة المعاملات
   */
  async getTransactions(
    userId: string,
    options?: { type?: string; page?: number; limit?: number },
  ) {
    const wallet = await this.getWallet(userId);
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);

    const where: any = { walletId: wallet.id };
    if (options?.type) {
      where.type = options.type;
    }

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * إعدادات الشحن التلقائي
   */
  async getAutoRecharge(userId: string) {
    const wallet = await this.getWallet(userId);
    return {
      enabled: wallet.autoRechargeEnabled,
      amount: wallet.autoRechargeAmount,
      threshold: wallet.autoRechargeThreshold,
    };
  }

  /**
   * تحديث إعدادات الشحن التلقائي
   */
  async updateAutoRecharge(userId: string, dto: UpdateAutoRechargeDto) {
    const wallet = await this.getWallet(userId);

    const updated = await this.prisma.developerWallet.update({
      where: { id: wallet.id },
      data: {
        autoRechargeEnabled: dto.enabled ?? wallet.autoRechargeEnabled,
        autoRechargeAmount: dto.amount ?? wallet.autoRechargeAmount,
        autoRechargeThreshold: dto.threshold ?? wallet.autoRechargeThreshold,
      },
    });

    await this.redis.del(`wallet:${userId}`);

    return {
      enabled: updated.autoRechargeEnabled,
      amount: updated.autoRechargeAmount,
      threshold: updated.autoRechargeThreshold,
    };
  }

  /**
   * تحديث تنبيه انخفاض الرصيد
   */
  async updateLowBalanceAlert(userId: string, dto: UpdateLowBalanceAlertDto) {
    const wallet = await this.getWallet(userId);

    const updated = await this.prisma.developerWallet.update({
      where: { id: wallet.id },
      data: {
        lowBalanceAlert: dto.threshold ?? null,
      },
    });

    return { lowBalanceAlert: updated.lowBalanceAlert };
  }

  /**
   * أسعار الرسائل
   */
  getPricing() {
    return Object.entries(MESSAGE_PRICING).map(([category, price]) => ({
      category,
      priceIQD: price,
      description: this.getCategoryDescription(category),
    }));
  }

  /**
   * الحصول على الرصيد (مع كاش)
   */
  async getBalance(userId: string): Promise<number> {
    const cached = await this.redis.get<number>(`wallet:${userId}:balance`);
    if (cached !== null && cached !== undefined) return cached;

    const wallet = await this.getWallet(userId);
    await this.redis.set(`wallet:${userId}:balance`, wallet.balance, 60);
    return wallet.balance;
  }

  /**
   * شحن تلقائي
   */
  private async triggerAutoRecharge(userId: string, wallet: any) {
    if (!wallet.autoRechargeAmount) return;

    // Auto-recharge requires a saved payment method — disabled until gateway integration ships.
    this.logger.warn(
      `Auto-recharge skipped for user ${userId}: payment gateway not integrated`,
    );
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      AUTHENTICATION: 'رسائل المصادقة (OTP)',
      UTILITY: 'رسائل الخدمات (تأكيد طلب، تتبع)',
      MARKETING: 'رسائل تسويقية (عروض، حملات)',
      SERVICE: 'محادثات خدمة العملاء (مجانية - أول 1000/شهر)',
      REFERRAL_CONVERSION: 'إحالات (مجانية)',
    };
    return descriptions[category] || category;
  }
}
