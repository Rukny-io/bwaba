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
    const taken = await this.prisma.mailDomain.findUnique({
      where: { domain },
      select: { mailApp: { select: { appId: true } } },
    });
    if (taken && taken.mailApp.appId !== appId) {
      throw new ConflictException('This domain is already connected.');
    }

    // Never delete an existing SES identity during provisioning: the current
    // domain may still serve live mail, and SES creation is idempotent.
    const identity = await this.ses.createEmailIdentity(domain);
    const appUpdate = await this.prisma.mailApp.update({
      where: { appId },
      data: {
        // Keep the first domain as the compatibility/default domain. Additional
        // domains are represented only by MailDomain.
        ...(access.app.primaryDomain ? {} : {
          primaryDomain: domain,
          domainStatus: MailDomainStatus.PENDING_DNS,
          domainCheckedAt: null,
        }),
      },
      select: { id: true, appId: true, primaryDomain: true, domainStatus: true, domainCheckedAt: true },
    });
    const domainRow = await this.prisma.mailDomain.upsert({
      where: { domain },
      create: {
        mailAppId: appUpdate.id,
        domain,
        status: MailDomainStatus.PENDING_DNS,
      },
      update: {
        status: MailDomainStatus.PENDING_DNS,
        checkedAt: null,
      },
      select: { id: true, domain: true, status: true },
    });

    return {
      app: appUpdate,
      domain: domainRow,
      ses: {
        sending: identity.sending,
        dkim: identity.dkim,
        tokens: identity.tokens,
      },
    };
  }
}
