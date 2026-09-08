import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { ApiKeyAuthGuard } from '../../developer/api-keys/guards/api-key-auth.guard';
import { RequireScopes } from '../../developer/api-keys/decorators/require-scopes.decorator';
import type { EmailApiRequest } from '../shared/email-api-request';
import { CreateEmailDomainDto } from './dto/create-email-domain.dto';
import { CreateEmailSenderDto } from './dto/create-email-sender.dto';
import { EmailDomainsService } from './email-domains.service';

@Public()
@ApiTags('Email API - Domains')
@UseGuards(ApiKeyAuthGuard)
@Controller({ path: 'email', version: '1' })
export class EmailDomainsController {
  constructor(private readonly domains: EmailDomainsService) {}

  @Get('domains')
  @RequireScopes('email:domains:read')
  @ApiOperation({ summary: 'List email domains' })
  list(@Req() request: EmailApiRequest) {
    return this.domains.list(request.userId);
  }

  @Post('domains')
  @RequireScopes('email:domains:write')
  @ApiOperation({ summary: 'Start domain verification' })
  create(@Req() request: EmailApiRequest, @Body() dto: CreateEmailDomainDto) {
    return this.domains.create(request.userId, dto.domain);
  }

  @Get('domains/:domain')
  @RequireScopes('email:domains:read')
  @ApiOperation({ summary: 'Refresh domain verification status' })
  get(@Req() request: EmailApiRequest, @Param('domain') domain: string) {
    return this.domains.get(request.userId, domain);
  }

  @Post('senders')
  @RequireScopes('email:domains:write')
  @ApiOperation({ summary: 'Authorize a verified sender for the current app' })
  createSender(
    @Req() request: EmailApiRequest,
    @Body() dto: CreateEmailSenderDto,
  ) {
    if (!request.apiKey?.developerAppId)
      throw new ForbiddenException('API key is not linked to a developer app.');
    return this.domains.createSender(
      request.userId,
      request.apiKey.developerAppId,
      dto.email,
    );
  }
}
