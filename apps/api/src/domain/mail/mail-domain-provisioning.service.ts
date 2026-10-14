import {
  BadRequestException,
  ConflictException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDomainStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailSesService } from './mail-ses.service';
import { MailAppAccessService } from './mail-app-access.service';
import { MailUnifiedEntitlementService } from './mail-unified-entitlement.service';
import { MailBillingAccountService } from './mail-billing-account.service';
import { MailPlanQuotaService } from './mail-plan-quota.service';

const DOMAIN_RE =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

@Injectable()
export class MailDomainProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly access: MailAppAccessService,
    private readonly quota: MailPlanQuotaService,
    private readonly entitlement: MailUnifiedEntitlementService,
    private readonly config: ConfigService,
    @Optional() private readonly billingAccounts?: MailBillingAccountService,
  ) {}

  async provision(userId: string, appId: string, rawDomain: string) {
    const domain = rawDomain.trim().toLowerCase().replace(/\.$/, '');
    if (!DOMAIN_RE.test(domain)) {
      throw new BadRequestException('Invalid domain name.');
    }

    const access = await this.access.requireOwner(userId, appId);
    const unified = ['true', '1'].includes(
      this.config.get<string>('MAIL_UNIFIED_BILLING_ONLY') ?? '',
    );
    if (unified) {
      await this.entitlement.assertCanAttachDomain(
        access.app.id,
        userId,
        domain,
      );
    } else {
      if (this.billingAccounts) {
        await this.billingAccounts.assertDomainCapacity(access.app.id, domain);
      } else {
        await this.quota.assertCanAttachDomain(access.app.id, userId, domain);
      }
    }
    const taken = await this.prisma.mailApp.findFirst({
      where: { primaryDomain: domain, status: 'ACTIVE', appId: { not: appId } },
      select: { appId: true },
    });
    if (taken) throw new ConflictException('This domain is already connected.');

    // Never delete an existing SES identity during provisioning: the current
    // domain may still serve live mail, and SES creation is idempotent.
    const identity = await this.ses.createEmailIdentity(domain);
    const updated = await this.prisma.mailApp.update({
      where: { appId },
      data: {
        primaryDomain: domain,
        domainStatus: MailDomainStatus.PENDING_DNS,
        domainCheckedAt: null,
      },
      select: {
        appId: true,
        primaryDomain: true,
        domainStatus: true,
        domainCheckedAt: true,
      },
    });

    return {
      app: updated,
      ses: {
        sending: identity.sending,
        dkim: identity.dkim,
        tokens: identity.tokens,
      },
    };
  }
}
