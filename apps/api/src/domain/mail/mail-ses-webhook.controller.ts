import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/common/decorators/auth/public.decorator';
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
    @Query('token') tokenQuery?: string,
    @Headers('x-mail-webhook-token') tokenHeader?: string,
  ) {
    this.inbound.assertWebhookToken(tokenQuery || tokenHeader);

    // Parse from rawBody first so global SanitizePipe never mutates the signed SNS envelope.
    const payload = parseSnsPayload(req);

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
