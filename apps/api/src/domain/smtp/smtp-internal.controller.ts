import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalOnly } from '../../core/common/decorators/auth/internal-only.decorator';
import {
  SmtpSendDeveloperDto,
  SmtpSendMailboxDto,
  SmtpValidateDeveloperKeyDto,
  SmtpValidateMailboxDto,
} from './dto/smtp-internal.dto';
import { SmtpInternalService } from './smtp-internal.service';

@ApiTags('Internal - SMTP')
@InternalOnly()
@Controller({ path: 'internal/smtp', version: '1' })
export class SmtpInternalController {
  constructor(private readonly smtp: SmtpInternalService) {}

  @Post('validate-developer-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate developer API key for SMTP AUTH' })
  validateDeveloperKey(@Body() dto: SmtpValidateDeveloperKeyDto) {
    return this.smtp.validateDeveloperKey(dto);
  }

  @Post('send-developer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Relay a developer SMTP message through Email API' })
  sendDeveloper(@Body() dto: SmtpSendDeveloperDto) {
    return this.smtp.sendDeveloper(dto);
  }

  @Post('validate-mailbox')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate mailbox app password for SMTP AUTH' })
  validateMailbox(@Body() dto: SmtpValidateMailboxDto) {
    return this.smtp.validateMailbox(dto);
  }

  @Post('send-mailbox')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Relay a mailbox SMTP message through Mail SES' })
  sendMailbox(@Body() dto: SmtpSendMailboxDto) {
    return this.smtp.sendMailbox(dto);
  }
}
