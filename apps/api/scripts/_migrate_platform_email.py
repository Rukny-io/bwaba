#!/usr/bin/env python3
from pathlib import Path
import re

root = Path('/home/bwaba/Documents/rukny-v1/apps/api/src')

# --- mail.module.ts: drop MailSesService from providers ---
mail_mod = root / 'domain/mail/mail.module.ts'
mt = mail_mod.read_text()
mt = mt.replace("import { MailSesService } from './mail-ses.service';\n", '')
# remove from providers only (first occurrence after MailForwarderService)
mt = mt.replace(
    """    MailForwarderService,
    MailSesService,
    MailInboundService,
""",
    """    MailForwarderService,
    MailInboundService,
""",
    1,
)
# keep MailSesService in exports OR rely on MailSesModule - remove duplicate provider export of class if module re-exports
# Nest re-export via MailSesModule is enough; remove MailSesService from exports list
mt = mt.replace(
    """    MailForwarderService,
    MailSesService,
    MailInboundService,
""",
    """    MailForwarderService,
    MailInboundService,
""",
    1,
)
mail_mod.write_text(mt)
print('mail.module updated')

# --- resend.service.ts ---
path = root / 'integrations/email/resend.service.ts'
text = path.read_text()

text = text.replace(
    "import { Resend } from 'resend';\n",
    "import { PlatformEmailService } from './platform-email.service';\n",
    1,
)
text = text.replace(
    """/**
 * 📧 Resend Email Service
 * Clean, minimal email design inspired by Google
 * https://resend.com/docs/api-reference/introduction
 */""",
    """/**
 * Transactional email templates (login, reset, receipts).
 * Transport: platform SES — same stack as Developer Email API.
 */""",
    1,
)

ctor_pat = re.compile(
    r"export class ResendService \{\n"
    r"  private readonly logger = new Logger\(ResendService\.name\);\n"
    r"  private resend: Resend \| null = null;\n"
    r"  private emailEnabled: boolean = false;\n"
    r"  private defaultFrom: string;\n\n"
    r"  constructor\(private configService: ConfigService\) \{.*?\n  \}\n",
    re.S,
)
ctor_new = """export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private defaultFrom: string;

  constructor(
    private configService: ConfigService,
    private readonly platformEmail: PlatformEmailService,
  ) {
    this.defaultFrom =
      this.configService.get<string>('MAIL_SYSTEM_FROM') ||
      this.configService.get<string>('MAIL_BILLING_FROM') ||
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'Rukny <noreply@rukny.io>';

    if (this.platformEmail.isEnabled()) {
      this.logger.log('✅ Template email service enabled via SES');
    } else {
      this.logger.warn(
        '⚠️ Template email disabled — missing AWS credentials for SES',
      );
    }
  }
"""
text, n = ctor_pat.subn(ctor_new, text, count=1)
assert n == 1, f'ctor n={n}'

text = text.replace(
    """  isEnabled(): boolean {
    return this.emailEnabled;
  }""",
    """  isEnabled(): boolean {
    return this.platformEmail.isEnabled();
  }""",
    1,
)

send_pat = re.compile(
    r"  async sendEmail\(options: EmailOptions\): Promise<EmailResult> \{.*?"
    r"return \{ success: false, error: error\.message \};\n  \}",
    re.S,
)
send_new = """  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const { to, subject, html, text, from, replyTo, cc, bcc, attachments } =
      options;

    if (!this.platformEmail.isEnabled()) {
      this.logger.log(`📧 [Email Disabled] To: ${to}, Subject: ${subject}`);
      return { success: true, messageId: 'console-only' };
    }

    try {
      const result = await this.platformEmail.send({
        to,
        subject,
        html,
        text,
        from: from || this.defaultFrom,
        replyTo,
        cc,
        bcc,
        attachments,
      });

      if (!result.success) {
        this.logger.error(`❌ Failed to send email: ${result.error}`);
        return { success: false, error: result.error };
      }

      this.logger.log(
        `✅ Email sent successfully to ${to} - ID: ${result.messageId}`,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Email error: ${message}`);
      return { success: false, error: message };
    }
  }"""
text, n2 = send_pat.subn(send_new, text, count=1)
assert n2 == 1, f'send n={n2}'

assert "from 'resend'" not in text
assert 'new Resend' not in text
path.write_text(text)
print('resend.service updated')
