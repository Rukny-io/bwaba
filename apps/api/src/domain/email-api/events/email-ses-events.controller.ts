import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
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
  handle(@Req() request: { body?: unknown; rawBody?: Buffer }, @Body() body: unknown) {
    const payload = body && typeof body === 'object'
      ? body
      : typeof body === 'string'
        ? JSON.parse(body)
        : request.rawBody
          ? JSON.parse(request.rawBody.toString('utf8'))
          : body;
    return this.events.handle(payload);
  }
}
