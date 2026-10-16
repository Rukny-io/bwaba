import { Injectable } from '@nestjs/common';
import { verifyDomainDns } from '@rukny/domain-verification';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailSesService } from './mail-ses.service';
import { MailAppAccessService } from './mail-app-access.service';

const SES_CONFIG = {
  region: 'eu-north-1',
  inboundMx: 'inbound-smtp.eu-north-1.amazonaws.com',
  mailFromMx: 'feedback-smtp.eu-north-1.amazonses.com',
  dkimTargetSuffix: 'dkim.amazonses.com',
  spfInclude: 'amazonses.com',
} as const;

@Injectable()
export class MailDomainStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly access: MailAppAccessService,
  ) {}

  async check(userId: string, appId: string, requestedDomain?: string) {
    await this.access.requireAccess(userId, appId);
    const app = await this.prisma.mailApp.findUniqueOrThrow({
      where: { appId },
      select: {
        appId: true,
        primaryDomain: true,
        domainOwnershipToken: true,
        domainOwnershipVerifiedAt: true,
      },
    });
    const normalized = requestedDomain?.trim().toLowerCase().replace(/\.$/, '');
    const domainRow = normalized
      ? await this.prisma.mailDomain.findFirst({
          where: { mailApp: { appId }, domain: normalized },
          select: {
            domain: true,
            status: true,
            checkedAt: true,
            ownershipToken: true,
            ownershipVerifiedAt: true,
          },
        })
      : null;
    const domain = domainRow?.domain ?? app.primaryDomain;
    if (!domain) return { setup: null };

    const ses = await this.ses.getEmailIdentity(domain);
    const result = await verifyDomainDns(domain, {
      dkimTokens: ses.tokens,
      ownershipToken:
        domainRow?.ownershipToken ?? app.domainOwnershipToken ?? undefined,
      sesConfig: SES_CONFIG,
      getSesStatus: async () => ses,
      // DMARC and custom MAIL FROM improve deliverability but should not make
      // a freshly configured domain appear broken while they propagate.
      requiredPurposes: ['RUKNY_OWNERSHIP', 'MX', 'SPF', 'DKIM'],
    });
    if (!result.ok) return result;

    const checkedAt = new Date();

    if (domainRow) {
      await this.prisma.mailDomain.update({
        where: { domain: domainRow.domain },
        data: {
          checkedAt,
          status: result.verified ? 'ACTIVE' : 'PENDING_DNS',
          verifiedAt: result.verified ? checkedAt : null,
          ownershipVerifiedAt: result.verified
            ? (domainRow.ownershipVerifiedAt ?? checkedAt)
            : null,
        },
      });
    }

    return {
      ...result,
      checkedAt: checkedAt.toISOString(),
      tokens: ses.tokens,
      ownershipVerifiedAt: result.verified
        ? (domainRow?.ownershipVerifiedAt?.toISOString() ??
          app.domainOwnershipVerifiedAt?.toISOString() ??
          checkedAt.toISOString())
        : null,
    };
  }
}
