import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { DeveloperModule } from '../developer/developer.module';
import { MailModule } from '../mail/mail.module';
import { EmailMessagesController } from './messaging/email-messages.controller';
import { EmailMessagesService } from './messaging/email-messages.service';
import { EmailEntitlementService } from './shared/email-entitlement.service';
import { EmailDomainsController } from './domains/email-domains.controller';
import { EmailDomainsService } from './domains/email-domains.service';
import { EmailDomainsPortalController } from './domains/email-domains-portal.controller';
import { SupportTicketsModule } from '../support-tickets/support-tickets.module';
import { EmailBillingController } from './billing/email-billing.controller';
import { EmailAppBillingController } from './billing/email-app-billing.controller';
import { EmailBillingService } from './billing/email-billing.service';
import { EmailBillingPeriodService } from './billing/email-billing-period.service';
import { EmailSesEventsController } from './events/email-ses-events.controller';
import { EmailSesEventsService } from './events/email-ses-events.service';
import { EmailApiTryController } from './try/email-api-try.controller';
import { EmailApiTryService } from './try/email-api-try.service';
import { EmailMarketingController } from './marketing/email-marketing.controller';
import { EmailMarketingContactsService } from './marketing/email-marketing-contacts.service';
import { EmailMarketingBroadcastsService } from './marketing/email-marketing-broadcasts.service';
import { EmailAutomationController } from './automations/email-automation.controller';
import { EmailAutomationService } from './automations/email-automation.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => DeveloperModule),
    MailModule,
    SupportTicketsModule,
  ],
  controllers: [
    EmailMessagesController,
    EmailDomainsController,
    EmailDomainsPortalController,
    EmailBillingController,
    EmailAppBillingController,
    EmailSesEventsController,
    EmailApiTryController,
    EmailMarketingController,
    EmailAutomationController,
  ],
  providers: [
    EmailMessagesService,
    EmailDomainsService,
    EmailEntitlementService,
    EmailBillingService,
    EmailBillingPeriodService,
    EmailSesEventsService,
    EmailApiTryService,
    EmailMarketingContactsService,
    EmailMarketingBroadcastsService,
    EmailAutomationService,
  ],
  exports: [EmailEntitlementService, EmailMessagesService, EmailBillingService],
})
export class EmailApiModule {}
