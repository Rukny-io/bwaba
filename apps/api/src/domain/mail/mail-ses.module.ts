import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailSesService } from './mail-ses.service';

/**
 * Shared SES transport for Rukny Mail product + platform transactional email.
 * Same AWS path as Developer Email API (no Resend).
 */
@Module({
  imports: [ConfigModule],
  providers: [MailSesService],
  exports: [MailSesService],
})
export class MailSesModule {}
