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
  handle(
    @Req() request: { body?: unknown; rawBody?: Buffer },
    @Body() body: unknown,
  ) {
    let payload: unknown = body;
    if (typeof body === 'string') {
      payload = JSON.parse(body) as unknown;
    } else if ((!body || typeof body !== 'object') && request.rawBody) {
      payload = JSON.parse(request.rawBody.toString('utf8')) as unknown;
    }
    return this.events.handle(payload);
  }
}
