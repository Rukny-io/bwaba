import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { MailMessagesService } from './mail-messages.service';

@ApiTags('Mail - Public')
@Controller({ path: 'mail/public', version: '1' })
export class MailPublicController {
  constructor(private readonly messages: MailMessagesService) {}

  @Public()
  @Get('stats')
  @ApiOperation({
    summary: 'Platform outbound send count for the marketing homepage',
  })
  async stats() {
    const emailsSent = await this.messages.countPlatformEmailsSent();
    return { emailsSent };
  }
}
