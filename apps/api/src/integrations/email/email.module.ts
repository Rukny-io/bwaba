import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailSesModule } from '../../domain/mail/mail-ses.module';
import { EmailService } from './email.service';
import { PlatformEmailService } from './platform-email.service';
import { ResendService } from './resend.service';

@Module({
  imports: [ConfigModule, MailSesModule],
  providers: [PlatformEmailService, EmailService, ResendService],
  exports: [PlatformEmailService, EmailService, ResendService],
})
export class EmailModule {}
