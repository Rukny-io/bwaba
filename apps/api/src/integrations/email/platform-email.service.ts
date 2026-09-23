import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailSesService } from '../../domain/mail/mail-ses.service';

export type PlatformEmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type PlatformEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** Raw address or `Name <email@domain>` */
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: PlatformEmailAttachment[];
};

export type PlatformEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Platform transactional email over Amazon SES (Developer Email / Mail stack).
 * Replaces Resend/SMTP for login, OTP, notifications, and system mail.
 */
@Injectable()
export class PlatformEmailService {
  private readonly logger = new Logger(PlatformEmailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mailSes: MailSesService,
  ) {
    if (this.isEnabled()) {
      const from = this.resolveFrom();
      this.logger.log(
        `✅ Platform email enabled via SES — From: ${from.name} <${from.email}>`,
      );
    } else {
      this.logger.warn(
        '⚠️ Platform email disabled — missing AWS credentials for SES',
      );
    }
  }

  isEnabled(): boolean {
    return this.mailSes.isConfigured();
  }

  async send(options: PlatformEmailOptions): Promise<PlatformEmailResult> {
    const toList = this.asList(options.to);
    if (!toList.length) {
      return { success: false, error: 'missing_recipient' };
    }

    if (!this.isEnabled()) {
      this.logger.log(
        `📧 [SIMULATED SES] To: ${toList.join(', ')} · ${options.subject}`,
      );
      return { success: true, messageId: 'console-only' };
    }

    const from = this.resolveFrom(options.from);
    const domain = from.email.split('@')[1] || 'rukny.io';
    const messageIdHeader = `<platform-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}@${domain}>`;

    try {
      const result = await this.mailSes.sendEmail({
        from: from.email,
        fromName: from.name,
        to: toList,
        cc: this.asList(options.cc),
        bcc: this.asList(options.bcc),
        replyTo: this.asList(options.replyTo),
        subject: options.subject,
        bodyHtml: options.html,
        bodyText: options.text,
        messageIdHeader,
        configurationSetName:
          this.config.get<string>('EMAIL_SES_CONFIGURATION_SET')?.trim() ||
          undefined,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          contentType: att.contentType || 'application/octet-stream',
          content: Buffer.isBuffer(att.content)
            ? att.content
            : Buffer.from(String(att.content), 'utf8'),
        })),
      });

      this.logger.log(
        `✅ Platform email sent via SES to ${toList.join(', ')} · ${result.sesMessageId}`,
      );
      return { success: true, messageId: result.sesMessageId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'SES send failed';
      this.logger.error(`❌ Platform email failed: ${message}`);
      return { success: false, error: message };
    }
  }

  private resolveFrom(override?: string): { email: string; name: string } {
    const raw =
      override?.trim() ||
      this.config.get<string>('MAIL_SYSTEM_FROM')?.trim() ||
      this.config.get<string>('MAIL_BILLING_FROM')?.trim() ||
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      this.config.get<string>('SMTP_FROM_EMAIL')?.trim() ||
      'Rukny <noreply@rukny.io>';

    const angled = raw.match(/^(.*?)\s*<([^>]+)>$/);
    if (angled) {
      return {
        name: angled[1].replace(/"/g, '').trim() || 'Rukny',
        email: angled[2].trim().toLowerCase(),
      };
    }

    if (raw.includes('@')) {
      const name =
        this.config.get<string>('SMTP_FROM_NAME')?.trim() || 'Rukny';
      return { email: raw.toLowerCase(), name };
    }

    return { email: 'noreply@rukny.io', name: 'Rukny' };
  }

  private asList(value?: string | string[]): string[] | undefined {
    if (!value) return undefined;
    const list = (Array.isArray(value) ? value : [value])
      .map((item) => String(item).trim())
      .filter(Boolean);
    return list.length ? list : undefined;
  }
}
