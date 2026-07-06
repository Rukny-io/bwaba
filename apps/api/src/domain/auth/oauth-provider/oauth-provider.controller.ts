import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { OAuthProviderService } from './oauth-provider.service';
import { OAuthTokenDto } from './dto/oauth-token.dto';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthProviderController {
  constructor(private readonly oauth: OAuthProviderService) {}

  /**
   * OAuth2 authorization endpoint for third-party integrations (e.g. Make.com).
   * Redirect URI whitelist: INTEGRATION_OAUTH_REDIRECT_URIS
   */
  @Get('authorize')
  @SkipThrottle()
  @ApiOperation({ summary: 'OAuth2 authorize (Make / integrations)' })
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('scope') scope: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { clientId: validClientId, redirectUri: validRedirectUri } =
      this.oauth.validateAuthorizeRequest({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
      });

    const apiPublic = this.oauth.getApiPublicUrl(
      `${req.protocol}://${req.get('host')}`,
    );

    const authorizeUrl = this.oauth.getAuthorizeUrl(apiPublic, {
      client_id: validClientId,
      redirect_uri: validRedirectUri,
      response_type: 'code',
      scope: scope || 'forms:read',
      ...(state ? { state } : {}),
    });

    const user = await this.oauth.resolveUserFromRequest(req);
    if (!user) {
      return res.redirect(this.oauth.getAccountsLoginUrl(authorizeUrl));
    }

    const scopes = this.oauth.parseScopes(scope);
    const code = await this.oauth.createAuthorizationCode({
      userId: user.id,
      email: user.email,
      clientId: validClientId,
      redirectUri: validRedirectUri,
      scopes,
    });

    const target = new URL(validRedirectUri);
    target.searchParams.set('code', code);
    if (state) target.searchParams.set('state', state);

    return res.redirect(target.toString());
  }

  @Get('callback')
  @SkipThrottle()
  @ApiExcludeEndpoint()
  async browserCallback(
    @Query('code') code: string,
    @Query('next') next: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.oauth.completeBrowserCallback(code, next, req, res);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiExcludeEndpoint()
  async token(@Body() body: OAuthTokenDto, @Req() req: Request) {
    const grantType = body.grant_type?.trim();

    if (grantType === 'authorization_code') {
      if (!body.code || !body.redirect_uri) {
        throw new BadRequestException('code and redirect_uri are required');
      }

      this.oauth.assertClient(
        body.client_id,
        body.client_secret,
      );
      this.oauth.assertRedirectUri(body.redirect_uri);

      const record = await this.oauth.consumeAuthorizationCode(
        body.code,
        body.client_id,
        body.redirect_uri,
      );

      return this.oauth.issueTokens(
        record.userId,
        record.email,
        record.scopes,
        req.headers['user-agent'],
        req.ip,
      );
    }

    if (grantType === 'refresh_token') {
      if (!body.refresh_token) {
        throw new BadRequestException('refresh_token is required');
      }

      return this.oauth.refreshAccessToken(
        body.refresh_token,
        body.client_id,
        body.client_secret,
        req.headers['user-agent'],
        req.ip,
      );
    }

    throw new BadRequestException('Unsupported grant_type');
  }
}
