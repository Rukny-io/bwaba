import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MailFeatureFlags } from '../mail-feature-flags';

@Injectable()
export class MailBodyEncryptionPolicy {
  constructor(
    private readonly flags: MailFeatureFlags,
    private readonly prisma: PrismaService,
  ) {}

  globalEnabled(): boolean {
    return this.flags.bodyEncryptionEnabled();
  }

  async isEnabledForMailApp(mailAppUuid: string): Promise<boolean> {
    if (!this.globalEnabled()) return false;
    const app = await this.prisma.mailApp.findUnique({
      where: { id: mailAppUuid },
      select: { bodyEncryptionEnabled: true },
    });
    return app?.bodyEncryptionEnabled === true;
  }
}
