import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { DeveloperModule } from '../developer/developer.module';
import { EmailApiModule } from '../email-api/email-api.module';
import { MailModule } from '../mail/mail.module';
import { SmtpInternalController } from './smtp-internal.controller';
import { SmtpInternalService } from './smtp-internal.service';

@Module({
  imports: [PrismaModule, DeveloperModule, EmailApiModule, MailModule],
  controllers: [SmtpInternalController],
  providers: [SmtpInternalService],
  exports: [SmtpInternalService],
})
export class SmtpInternalModule {}
