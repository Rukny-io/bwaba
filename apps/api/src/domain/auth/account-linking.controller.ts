import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AccountLinkingService,
  OAuthProvider,
} from './account-linking.service';
import { assertOAuthProviderEnabled } from './oauth-providers.config';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { Request, Response } from 'express';

@ApiTags('Auth - Account Linking')
@Controller('auth/linking')
export class AccountLinkingController {
  constructor(private readonly accountLinkingService: AccountLinkingService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current linked providers status' })
  @ApiResponse({
    status: 200,
    description: 'Linked providers status retrieved',
  })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.accountLinkingService.getLinkedProviders(user.id);
  }

  @Get('google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate Google account linking' })
  async linkGoogle(
    @CurrentUser() user: AuthenticatedUser,
    @Query('redirect_origin') redirectOrigin: string,
    @Res() res: Response,
  ) {
    const linkToken = await this.accountLinkingService.initiateLinking(
      user.id,
      'google',
    );
    const originParam = redirectOrigin
      ? `&redirect_origin=${encodeURIComponent(redirectOrigin)}`
      : '';
    return res.redirect(
      `/api/v1/auth/google?link_token=${linkToken}${originParam}`,
    );
  }

  @Get('linkedin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate LinkedIn account linking' })
  async linkLinkedin(
    @CurrentUser() user: AuthenticatedUser,
    @Query('redirect_origin') redirectOrigin: string,
    @Res() res: Response,
  ) {
    const linkToken = await this.accountLinkingService.initiateLinking(
      user.id,
      'linkedin',
    );
    const originParam = redirectOrigin
      ? `&redirect_origin=${encodeURIComponent(redirectOrigin)}`
      : '';
    return res.redirect(
      `/api/v1/auth/linkedin?link_token=${linkToken}${originParam}`,
    );
  }

  @Get('facebook')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate Facebook account linking' })
  async linkFacebook(
    @CurrentUser() user: AuthenticatedUser,
    @Query('redirect_origin') redirectOrigin: string,
    @Res() res: Response,
  ) {
    assertOAuthProviderEnabled('facebook');
    const linkToken = await this.accountLinkingService.initiateLinking(
      user.id,
      'facebook',
    );
    const originParam = redirectOrigin
      ? `&redirect_origin=${encodeURIComponent(redirectOrigin)}`
      : '';
    return res.redirect(
      `/api/v1/auth/facebook?link_token=${linkToken}${originParam}`,
    );
  }

  @Get('github')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate GitHub account linking' })
  async linkGithub(
    @CurrentUser() user: AuthenticatedUser,
    @Query('redirect_origin') redirectOrigin: string,
    @Res() res: Response,
  ) {
    assertOAuthProviderEnabled('github');
    const linkToken = await this.accountLinkingService.initiateLinking(
      user.id,
      'github',
    );
    const originParam = redirectOrigin
      ? `&redirect_origin=${encodeURIComponent(redirectOrigin)}`
      : '';
    return res.redirect(
      `/api/v1/auth/github?link_token=${linkToken}${originParam}`,
    );
  }

  @Delete(':provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unlink an OAuth provider' })
  @ApiResponse({ status: 200, description: 'Provider unlinked successfully' })
  async unlinkProvider(
    @CurrentUser() user: AuthenticatedUser,
    @Param('provider') provider: OAuthProvider,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.accountLinkingService.unlinkProvider(
      user.id,
      provider,
      ipAddress,
      userAgent,
    );
  }
}
