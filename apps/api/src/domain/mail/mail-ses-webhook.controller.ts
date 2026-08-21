import {
  Body,
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
    @Body() body: unknown,
    @Query('token') tokenQuery?: string,
    @Headers('x-mail-webhook-token') tokenHeader?: string,
  ) {
    this.inbound.assertWebhookToken(tokenQuery || tokenHeader);

    // SNS may send text/plain JSON — Nest may already parse it.
    const payload =
      body && typeof body === 'object'
        ? body
        : typeof body === 'string'
          ? safeJson(body)
          : req.rawBody
            ? safeJson(req.rawBody.toString('utf8'))
            : body;

    return this.inbound.handleSnsPayload(payload);
  }
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
