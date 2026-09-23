import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MailAppStatus,
  MailFilterAction,
  MailFilterMatchField,
  MailFilterRuleType,
  MailMailboxStatus,
  MailMessageFolder,
  MailPlan,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  CreateMailFilterRuleDto,
  UpdateMailFilterRuleDto,
  UpdateMailSecuritySettingsDto,
} from './dto/mail-filter-rule.dto';
import {
  assertValidRuleAction,
  compileSafeRegex,
  evaluateMailFilterRules,
  isPremiumRegexField,
  normalizeFilterPattern,
  type MailFilterEvaluateInput,
  type MailFilterEvaluateResult,
  type MailFilterRuleRow,
} from './mail-filter-rules.util';
import {
  DEFAULT_QUARANTINE_RETENTION_DAYS,
  quarantineExpiresAt,
} from './mail-quarantine.util';
import { MailSubscriptionsService } from './mail-subscriptions.service';

@Injectable()
export class MailFilterRulesService {
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

  private async ruleLimit(mailAppUuid: string) {
    const limits = await this.subscriptions.getActiveLimitsForApp(mailAppUuid);
    return Number(limits?.limits?.filterRules) || 0;
  }

  private toView(row: {
    id: string;
    mailboxId: string | null;
    ruleType: MailFilterRuleType;
    matchField: MailFilterMatchField;
    pattern: string;
    action: MailFilterAction;
    priority: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    mailbox: {
      localPart: string;
      domain: string;
      status: MailMailboxStatus;
    } | null;
  }) {
    return {
      id: row.id,
      mailboxId: row.mailboxId,
      mailboxAddress: row.mailbox
        ? `${row.mailbox.localPart}@${row.mailbox.domain}`
        : null,
      ruleType: row.ruleType,
      matchField: row.matchField,
      pattern: row.pattern,
      action: row.action,
      priority: row.priority,
      enabled:
        row.enabled &&
        (row.mailbox == null ||
          row.mailbox.status === MailMailboxStatus.ACTIVE),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async requireActiveMailbox(mailAppId: string, mailboxId: string) {
    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (!mailbox) {
      throw new BadRequestException('Mailbox not found or inactive.');
    }
    return mailbox;
  }

  private async assertPremiumRegexIfNeeded(
    mailAppUuid: string,
    matchField: MailFilterMatchField,
  ) {
    if (!isPremiumRegexField(matchField)) return;
    const active = await this.subscriptions.getActiveLimitsForApp(mailAppUuid);
    if (active?.plan !== MailPlan.PREMIUM) {
      throw new BadRequestException(
        'Regex filter rules require the Premium plan.',
      );
    }
  }

  private validateDto(
    ruleType: MailFilterRuleType,
    matchField: MailFilterMatchField,
    action: MailFilterAction,
    pattern: string,
  ) {
    try {
      assertValidRuleAction(ruleType, action);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid rule action.',
      );
    }

    if (matchField === MailFilterMatchField.SENDER) {
      const normalized = pattern.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new BadRequestException('Enter a valid sender email address.');
      }
    }

    if (matchField === MailFilterMatchField.DOMAIN) {
      const normalized = pattern.trim().toLowerCase();
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(normalized)) {
        throw new BadRequestException('Enter a valid domain name.');
      }
    }

    if (matchField === MailFilterMatchField.RECIPIENT) {
      const normalized = pattern.trim().toLowerCase();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
      const isDomain =
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
          normalized,
        );
      if (!isEmail && !isDomain) {
        throw new BadRequestException(
          'Enter a valid recipient email or domain.',
        );
      }
    }

    if (isPremiumRegexField(matchField) && !compileSafeRegex(pattern.trim())) {
      throw new BadRequestException('Enter a valid regular expression pattern.');
    }
  }

  async list(userId: string, appId: string, ruleType?: MailFilterRuleType) {
    const app = await this.requireOwnedApp(userId, appId);
    const [limit, rows] = await Promise.all([
      this.ruleLimit(app.id),
      this.prisma.mailFilterRule.findMany({
        where: {
          mailAppId: app.id,
          ...(ruleType ? { ruleType } : {}),
        },
        include: {
          mailbox: {
            select: { localPart: true, domain: true, status: true },
          },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);
    return {
      domain: app.primaryDomain,
      limit,
      used: rows.length,
      rules: rows.map((row) => this.toView(row)),
    };
  }

  async create(userId: string, appId: string, dto: CreateMailFilterRuleDto) {
    const app = await this.requireOwnedApp(userId, appId);
    const limit = await this.ruleLimit(app.id);
    const used = await this.prisma.mailFilterRule.count({
      where: { mailAppId: app.id },
    });
    if (used >= limit) {
      throw new BadRequestException(
        `Filter rule limit reached for this app (${limit}). Upgrade your plan for more rules.`,
      );
    }

    this.validateDto(dto.ruleType, dto.matchField, dto.action, dto.pattern);
    await this.assertPremiumRegexIfNeeded(app.id, dto.matchField);

    if (dto.mailboxId) {
      await this.requireActiveMailbox(app.id, dto.mailboxId);
    }

    const pattern = normalizeFilterPattern(dto.matchField, dto.pattern);

    const row = await this.prisma.mailFilterRule.create({
      data: {
        mailAppId: app.id,
        mailboxId: dto.mailboxId ?? null,
        ruleType: dto.ruleType,
        matchField: dto.matchField,
        pattern,
        action: dto.action,
        priority: dto.priority ?? 100,
        enabled: true,
      },
      include: {
        mailbox: {
          select: { localPart: true, domain: true, status: true },
        },
      },
    });

    return { rule: this.toView(row) };
  }

  async update(
    userId: string,
    appId: string,
    ruleId: string,
    dto: UpdateMailFilterRuleDto,
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailFilterRule.findFirst({
      where: { id: ruleId, mailAppId: app.id },
      include: {
        mailbox: { select: { localPart: true, domain: true, status: true } },
      },
    });
    if (!existing) throw new NotFoundException('Filter rule not found.');

    const matchField = dto.matchField ?? existing.matchField;
    const action = dto.action ?? existing.action;
    const pattern = dto.pattern ?? existing.pattern;

    this.validateDto(existing.ruleType, matchField, action, pattern);
    await this.assertPremiumRegexIfNeeded(app.id, matchField);

    let mailboxId = existing.mailboxId;
    if (dto.mailboxId !== undefined) {
      if (dto.mailboxId === null) {
        mailboxId = null;
      } else {
        await this.requireActiveMailbox(app.id, dto.mailboxId);
        mailboxId = dto.mailboxId;
      }
    }

    const row = await this.prisma.mailFilterRule.update({
      where: { id: existing.id },
      data: {
        mailboxId,
        matchField,
        pattern: normalizeFilterPattern(matchField, pattern),
        action,
        ...(dto.priority === undefined ? {} : { priority: dto.priority }),
        ...(dto.enabled === undefined ? {} : { enabled: dto.enabled }),
      },
      include: {
        mailbox: {
          select: { localPart: true, domain: true, status: true },
        },
      },
    });

    return { rule: this.toView(row) };
  }

  async remove(userId: string, appId: string, ruleId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailFilterRule.findFirst({
      where: { id: ruleId, mailAppId: app.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Filter rule not found.');
    await this.prisma.mailFilterRule.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async getSecuritySettings(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const settings = await this.prisma.mailAppSecuritySettings.findUnique({
      where: { mailAppId: app.id },
    });
    return this.toSecuritySettingsView(settings);
  }

  async updateSecuritySettings(
    userId: string,
    appId: string,
    dto: UpdateMailSecuritySettingsDto,
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const settings = await this.prisma.mailAppSecuritySettings.upsert({
      where: { mailAppId: app.id },
      create: {
        mailAppId: app.id,
        quarantineSuspicious: dto.quarantineSuspicious ?? true,
        notifyOnQuarantine: dto.notifyOnQuarantine ?? false,
        quarantineRetentionDays:
          dto.quarantineRetentionDays ?? DEFAULT_QUARANTINE_RETENTION_DAYS,
        quarantineNewSendersWithoutDmarc:
          dto.quarantineNewSendersWithoutDmarc ?? false,
      },
      update: {
        ...(dto.quarantineSuspicious === undefined
          ? {}
          : { quarantineSuspicious: dto.quarantineSuspicious }),
        ...(dto.notifyOnQuarantine === undefined
          ? {}
          : { notifyOnQuarantine: dto.notifyOnQuarantine }),
        ...(dto.quarantineRetentionDays === undefined
          ? {}
          : { quarantineRetentionDays: dto.quarantineRetentionDays }),
        ...(dto.quarantineNewSendersWithoutDmarc === undefined
          ? {}
          : {
              quarantineNewSendersWithoutDmarc:
                dto.quarantineNewSendersWithoutDmarc,
            }),
      },
    });
    return this.toSecuritySettingsView(settings);
  }

  private toSecuritySettingsView(
    settings: {
      quarantineSuspicious: boolean;
      notifyOnQuarantine: boolean;
      quarantineRetentionDays: number;
      quarantineNewSendersWithoutDmarc: boolean;
    } | null,
  ) {
    return {
      quarantineSuspicious: settings?.quarantineSuspicious ?? true,
      notifyOnQuarantine: settings?.notifyOnQuarantine ?? false,
      quarantineRetentionDays:
        settings?.quarantineRetentionDays ?? DEFAULT_QUARANTINE_RETENTION_DAYS,
      quarantineNewSendersWithoutDmarc:
        settings?.quarantineNewSendersWithoutDmarc ?? false,
    };
  }

  async loadRulesForMailbox(
    mailAppId: string,
    mailboxId: string,
  ): Promise<MailFilterRuleRow[]> {
    return this.prisma.mailFilterRule.findMany({
      where: {
        mailAppId,
        enabled: true,
        OR: [{ mailboxId: null }, { mailboxId }],
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getSecuritySettingsForApp(mailAppId: string) {
    const settings = await this.prisma.mailAppSecuritySettings.findUnique({
      where: { mailAppId },
    });
    return this.toSecuritySettingsView(settings);
  }

  quarantineExpiryForApp(
    settings: {
      quarantineRetentionDays: number;
    } | null,
    from = new Date(),
  ) {
    const days =
      settings?.quarantineRetentionDays ?? DEFAULT_QUARANTINE_RETENTION_DAYS;
    return quarantineExpiresAt(days, from);
  }

  evaluate(
    rules: MailFilterRuleRow[],
    input: MailFilterEvaluateInput,
  ): MailFilterEvaluateResult | null {
    return evaluateMailFilterRules(rules, input);
  }

  actionToFolder(action: MailFilterAction): MailMessageFolder | null {
    switch (action) {
      case MailFilterAction.SPAM:
        return MailMessageFolder.SPAM;
      case MailFilterAction.QUARANTINE:
        return MailMessageFolder.QUARANTINE;
      case MailFilterAction.INBOX:
        return MailMessageFolder.INBOX;
      case MailFilterAction.PROMOTIONS:
        return MailMessageFolder.PROMOTIONS;
      case MailFilterAction.SOCIAL:
        return MailMessageFolder.SOCIAL;
      default:
        return null;
    }
  }
}
