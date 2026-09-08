import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { ApiKeyAuthGuard } from '../../developer/api-keys/guards/api-key-auth.guard';
import { RequireScopes } from '../../developer/api-keys/decorators/require-scopes.decorator';
import type { EmailApiRequest } from '../shared/email-api-request';
import { SendEmailDto } from './dto/send-email.dto';
import { requireEmailIdempotencyKey } from './email-idempotency';
import { EmailMessagesService } from './email-messages.service';

@Public()
@ApiTags('Email API - Messages')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyAuthGuard)
@Controller({ path: 'email/messages', version: '1' })
export class EmailMessagesController {
  constructor(private readonly messages: EmailMessagesService) {}

  @Post()
  @RequireScopes('email:send')
  @ApiOperation({ summary: 'Send one transactional email' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: '8-128 alphanumeric characters, hyphens, or underscores.',
  })
  send(
    @Req() request: EmailApiRequest,
    @Body() dto: SendEmailDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.messages.send(
      request.userId,
      request.apiKeyId,
      dto,
      requireEmailIdempotencyKey(idempotencyKey),
    );
  }

  @Get(':id')
  @RequireScopes('email:read')
  @ApiOperation({ summary: 'Get an email delivery status' })
  getStatus(@Req() request: EmailApiRequest, @Param('id') externalId: string) {
    return this.messages.getStatus(
      request.userId,
      request.apiKeyId,
      externalId,
    );
  }
}
