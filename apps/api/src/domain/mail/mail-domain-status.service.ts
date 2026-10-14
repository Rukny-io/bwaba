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

  async check(userId: string, appId: string) {
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
    if (!app.primaryDomain) return { setup: null };

    const ses = await this.ses.getEmailIdentity(app.primaryDomain);
    const result = await verifyDomainDns(app.primaryDomain, {
      dkimTokens: ses.tokens,
      ownershipToken: app.domainOwnershipToken ?? undefined,
      sesConfig: SES_CONFIG,
      getSesStatus: async () => ses,
    });
    if (!result.ok) return result;

    const checkedAt = new Date();

    return {
      ...result,
      checkedAt: checkedAt.toISOString(),
      tokens: ses.tokens,
      ownershipVerifiedAt: result.verified
        ? (app.domainOwnershipVerifiedAt?.toISOString() ?? checkedAt.toISOString())
        : null,
    };
  }
}
