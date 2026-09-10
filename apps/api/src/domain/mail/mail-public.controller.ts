import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { MailBimiService } from './mail-bimi.service';
import { MailMessagesService } from './mail-messages.service';

@ApiTags('Mail - Public')
@Controller({ path: 'mail/public', version: '1' })
export class MailPublicController {
  constructor(
    private readonly messages: MailMessagesService,
    private readonly bimi: MailBimiService,
  ) {}

  @Public()
  @Get('bimi/:appId/logo.:format')
  @ApiOperation({ summary: 'Stable public BIMI logo asset' })
  async bimiLogo(
    @Param('appId') appId: string,
    @Param('format') format: string,
    @Res() response: Response,
  ) {
    if (format !== 'svg' && format !== 'webp') {
      throw new NotFoundException('BIMI logo not found.');
    }
    const body = await this.bimi.publicCustomerLogo(appId, format);
    if (!body) throw new NotFoundException('BIMI logo not found.');
    response.set({
      'Content-Type': format === 'svg' ? 'image/svg+xml' : 'image/webp',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    });
    return response.send(body);
  }

  @Public()
  @Get('bimi/:appId/authority.pem')
  @ApiOperation({ summary: 'Stable public BIMI CMC/VMC certificate' })
  async bimiAuthority(
    @Param('appId') appId: string,
    @Res() response: Response,
  ) {
    const body = await this.bimi.publicCustomerAuthority(appId);
    if (!body) throw new NotFoundException('BIMI certificate not found.');
    response.set({
      'Content-Type': 'application/pem-certificate-chain',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline; filename="authority.pem"',
    });
    return response.send(body);
  }

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
