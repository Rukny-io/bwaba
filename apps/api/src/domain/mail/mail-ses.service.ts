import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetEmailIdentityCommand,
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-sesv2';

const DEFAULT_SES_REGION = 'eu-north-1';

export type MailSesSendInput = {
  from: string;
  fromName?: string | null;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  replyTo?: string[];
  /** RFC Message-ID for this outbound message */
  messageIdHeader: string;
  inReplyTo?: string | null;
};

@Injectable()
export class MailSesService {
  private readonly logger = new Logger(MailSesService.name);
  private client: SESv2Client | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('AWS_SECRET_ACCESS_KEY')
      ?.trim();
    return Boolean(accessKeyId && secretAccessKey);
  }

  async getEmailIdentity(domain: string): Promise<{
    found: boolean;
    sending: boolean;
    dkim: string;
    tokens: string[];
  }> {
    try {
      const identity = await this.getClient().send(
        new GetEmailIdentityCommand({ EmailIdentity: domain }),
      );
      return {
        found: true,
        sending: Boolean(identity.VerifiedForSendingStatus),
        dkim: identity.DkimAttributes?.Status ?? 'NOT_STARTED',
        tokens: identity.DkimAttributes?.Tokens ?? [],
      };
    } catch (error) {
      const name =
        typeof error === 'object' && error && 'name' in error
          ? String(error.name)
          : '';
      if (name.includes('NotFound')) {
        return {
          found: false,
          sending: false,
          dkim: 'NOT_STARTED',
          tokens: [],
        };
      }
      throw error;
    }
  }

  private getClient(): SESv2Client {
    if (this.client) return this.client;

    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('AWS_SECRET_ACCESS_KEY')
      ?.trim();
    const region =
      this.config.get<string>('MAIL_AWS_REGION')?.trim() ||
      this.config.get<string>('AWS_REGION')?.trim() ||
      DEFAULT_SES_REGION;

    if (!accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        'AWS credentials are not configured for Mail SES.',
      );
    }

    this.client = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  async sendEmail(input: MailSesSendInput): Promise<{ sesMessageId: string }> {
    // messageIdHeader / inReplyTo reserved for Raw MIME send (threading headers).
    void input.messageIdHeader;
    void input.inReplyTo;

    const fromDisplay = input.fromName?.trim()
      ? `"${input.fromName.replace(/"/g, '')}" <${input.from}>`
      : input.from;

    const contentBody: NonNullable<
      SendEmailCommandInput['Content']
    >['Simple'] = {
      Subject: { Data: input.subject, Charset: 'UTF-8' },
      Body: {},
    };

    if (input.bodyText?.trim()) {
      contentBody.Body!.Text = {
        Data: input.bodyText,
        Charset: 'UTF-8',
      };
    }
    if (input.bodyHtml?.trim()) {
      contentBody.Body!.Html = {
        Data: input.bodyHtml,
        Charset: 'UTF-8',
      };
    }
    if (!contentBody.Body!.Text && !contentBody.Body!.Html) {
      contentBody.Body!.Text = { Data: '', Charset: 'UTF-8' };
    }

    const command = new SendEmailCommand({
      FromEmailAddress: fromDisplay,
      Destination: {
        ToAddresses: input.to,
        CcAddresses: input.cc?.length ? input.cc : undefined,
        BccAddresses: input.bcc?.length ? input.bcc : undefined,
      },
      ReplyToAddresses: input.replyTo?.length ? input.replyTo : [input.from],
      Content: { Simple: contentBody },
    });

    try {
      const result = await this.getClient().send(command);
      const sesMessageId = result.MessageId?.trim();
      if (!sesMessageId) {
        throw new ServiceUnavailableException(
          'SES did not return a message id.',
        );
      }
      return { sesMessageId };
    } catch (error) {
      this.logger.error(
        `SES send failed from=${input.from}`,
        error instanceof Error ? error.stack : undefined,
      );
      const message =
        error instanceof Error ? error.message : 'SES send failed.';
      if (
        message.includes('not authorized') ||
        message.includes('AccessDenied')
      ) {
        throw new ServiceUnavailableException(
          'AWS user cannot send with SES. Add ses:SendEmail permission.',
        );
      }
      if (message.includes('Email address is not verified')) {
        throw new ServiceUnavailableException(
          'Sender domain is not verified in SES for this region.',
        );
      }
      if (message.includes('sandbox')) {
        throw new ServiceUnavailableException(
          'SES account is in sandbox. Verify recipients or request production access.',
        );
      }
      throw new ServiceUnavailableException(message);
    }
  }
}
