import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { isSnsEnvelope } from '../../core/common/utils/sns-signature.util';
import { MailInboundService } from './mail-inbound.service';

@ApiTags('Mail - Webhooks')
@ApiExcludeController()
@Public()
@Controller({ path: 'mail/webhooks/ses', version: '1' })
export class MailSesWebhookController {
  constructor(private readonly inbound: MailInboundService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Amazon SNS/SES inbound webhook' })
  async handle(
    @Req() req: { body?: unknown; rawBody?: Buffer },
    @Headers('x-mail-webhook-token') tokenHeader?: string,
  ) {
    // Parse from rawBody first so global SanitizePipe never mutates the signed SNS envelope.
    const payload = parseSnsPayload(req);

    // Amazon SNS cannot send custom headers. Signed envelopes are authenticated
    // by Signature + TopicArn in handleSnsPayload. Direct SES JSON still needs
    // the shared secret header — never a query token (it leaks into access logs).
    if (!isSnsEnvelope(payload)) {
      this.inbound.assertWebhookToken(tokenHeader);
    }

    return this.inbound.handleSnsPayload(payload);
  }
}

function parseSnsPayload(req: {
  body?: unknown;
  rawBody?: Buffer;
}): unknown {
  if (req.rawBody?.length) {
    return safeJson(req.rawBody.toString('utf8'));
  }
  if (typeof req.body === 'string') {
    return safeJson(req.body);
  }
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return req.body;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
