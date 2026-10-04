import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { EmailSesEventsService } from './email-ses-events.service';

@Public()
@ApiExcludeController()
@Controller({ path: 'email/webhooks/ses', version: '1' })
export class EmailSesEventsController {
  constructor(private readonly events: EmailSesEventsService) {}

  @Post()
  @HttpCode(200)
  handle(@Req() request: { body?: unknown; rawBody?: Buffer }) {
    const payload = parseSnsPayload(request);
    return this.events.handle(payload);
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
