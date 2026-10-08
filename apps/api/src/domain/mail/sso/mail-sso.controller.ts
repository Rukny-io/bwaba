import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { getClientIp } from '../../../core/common/utils/client-ip.util';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { setMailboxSessionCookie } from '../../auth/cookie.config';
import { MailSsoOidcService } from './mail-sso-oidc.service';
import { MailSsoService } from './mail-sso.service';
import { MailSecurityAuditService } from '../mail-security-audit.service';
import {
  ConsumeMailSsoLinkDto,
  ProvisionMailSsoBulkDto,
  ProvisionMailSsoDto,
  ResendMailSsoLinkDto,
  UpdateMailSsoSettingsDto,
  UpsertMailIdentityProviderDto,
} from './dto/mail-sso.dto';

@ApiTags('Mail - SSO')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail', version: '1' })
export class MailSsoController {
  constructor(
    private readonly sso: MailSsoService,
    private readonly oidc: MailSsoOidcService,
    private readonly audit: MailSecurityAuditService,
  ) {}

  @Get('apps/:appId/security-audit')
  @ApiOperation({ summary: 'Security audit events for the Mail workspace' })
  auditLog(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('take') take?: string,
  ) {
    return this.audit.list(user.id, appId, take ? Number(take) : 50);
  }

  @Get('apps/:appId/sso')
  @ApiOperation({ summary: 'SSO overview: settings, people, mailboxes, links' })
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.sso.overview(user.id, appId);
  }

  @Get('apps/:appId/sso/settings')
  @ApiOperation({ summary: 'Quick sign-in settings for a workspace' })
  getSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.sso.getSettings(user.id, appId);
  }

  @Patch('apps/:appId/sso/settings')
  @ApiOperation({ summary: 'Update quick sign-in settings (owner/admin)' })
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UpdateMailSsoSettingsDto,
  ) {
    return this.sso.updateSettings(user.id, appId, dto);
  }

  @Post('apps/:appId/sso/provision')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Invite a teammate, assign a mailbox and email a one-click sign-in link',
  })
  provision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: ProvisionMailSsoDto,
  ) {
    return this.sso.provision(user.id, appId, dto);
  }

  @Post('apps/:appId/sso/provision/bulk')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Provision up to 100 teammates at once' })
  provisionBulk(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: ProvisionMailSsoBulkDto,
  ) {
    return this.sso.provisionBulk(user.id, appId, dto);
  }

  @Post('apps/:appId/sso/links/:linkId/resend')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Rotate a sign-in link and email it (or return it to copy)',
  })
  resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('linkId') linkId: string,
    @Body() dto: ResendMailSsoLinkDto,
  ) {
    return this.sso.resendLink(user.id, appId, linkId, dto);
  }

  @Delete('apps/:appId/sso/links/:linkId')
  @ApiOperation({ summary: 'Revoke an unused sign-in link' })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('linkId') linkId: string,
  ) {
    return this.sso.revokeLink(user.id, appId, linkId);
  }

  @Post('sso/links/:token/consume')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Use a quick sign-in link: join the workspace and open the mailbox',
  })
  async consume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
    @Body() dto: ConsumeMailSsoLinkDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.sso.consumeLink(user.id, token, dto ?? {});
    if (!('mailboxSessionToken' in result)) return result;
    const { mailboxSessionToken, ...rest } = result;
    if (mailboxSessionToken) setMailboxSessionCookie(res, mailboxSessionToken);
    return { ...rest, mailboxOpened: Boolean(mailboxSessionToken) };
  }

  // ---------------------------------------------------------------------------
  // Enterprise SSO (OIDC)
  // ---------------------------------------------------------------------------

  @Get('apps/:appId/sso/identity-provider')
  @ApiOperation({ summary: 'Identity provider config (secret never returned)' })
  getIdentityProvider(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.oidc.getIdentityProvider(user.id, appId);
  }

  @Put('apps/:appId/sso/identity-provider')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create or update the OIDC identity provider (owner/admin)',
  })
  upsertIdentityProvider(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UpsertMailIdentityProviderDto,
  ) {
    return this.oidc.upsertIdentityProvider(user.id, appId, dto);
  }

  @Post('apps/:appId/sso/identity-provider/test')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Fetch the IdP discovery document to check the connection',
  })
  testIdentityProvider(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.oidc.testIdentityProvider(user.id, appId);
  }

  @Delete('apps/:appId/sso/identity-provider')
  @ApiOperation({ summary: 'Disconnect the identity provider' })
  deleteIdentityProvider(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.oidc.deleteIdentityProvider(user.id, appId);
  }
}

/**
 * Unauthenticated SSO routes. Kept off MailSsoController because its class-level
 * JwtAuthGuard does not honor @Public().
 */
@ApiTags('Mail - SSO')
@Public()
@Controller({ path: 'mail', version: '1' })
export class MailSsoPublicController {
  constructor(
    private readonly sso: MailSsoService,
    private readonly oidc: MailSsoOidcService,
  ) {}

  @Get('sso/links/:token')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Preview a quick sign-in link' })
  preview(@Param('token') token: string) {
    return this.sso.previewLink(token);
  }

  @Get('sso/oidc/discover')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Does this email domain sign in with enterprise SSO?',
  })
  discover(@Query('email') email: string) {
    return this.oidc.discover(email ?? '');
  }

  @Get('sso/oidc/start')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Redirect to the identity provider' })
  async start(@Query('email') email: string, @Res() res: Response) {
    res.redirect(await this.oidc.startUrl(email ?? ''));
  }

  @Get('sso/oidc/callback')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'OIDC redirect URI' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const url = await this.oidc.handleCallback({
      code,
      state,
      error,
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIp(req),
    });
    res.redirect(url);
  }
}
