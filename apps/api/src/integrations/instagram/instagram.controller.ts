import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InstagramService } from './instagram.service';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';

@Controller('integrations/instagram')
export class InstagramController {
  private readonly appFrontendUrl: string;
  private readonly businessFrontendUrl: string;

  constructor(
    private readonly instagramService: InstagramService,
    private readonly config: ConfigService,
  ) {
    this.appFrontendUrl =
      this.config.get<string>('APP_FRONTEND_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      this.config.get<string>('FRONTEND_URL_DEV') ||
      'http://localhost:3000';

    this.businessFrontendUrl =
      this.config.get<string>('BUSINESS_FRONTEND_URL') ||
      this.config.get<string>('NEXT_PUBLIC_BUSINESS_URL') ||
      'http://localhost:3003';
  }

  /**
   * Start Instagram OAuth flow
   * GET /api/v1/integrations/instagram/auth
   */
  @Get('auth')
  @UseGuards(JwtAuthGuard)
  async authorize(
    @Req() req: any,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
    @Query('redirectBase') redirectBase?: string,
  ) {
    // Encode userId + optional redirect destination in state
    const statePayload = JSON.stringify({
      userId: req.user.id,
      redirect: redirect || '/app/instagram',
      redirectBase: redirectBase,
    });
    const state = Buffer.from(statePayload).toString('base64url');
    const authUrl = this.instagramService.getAuthUrl(state);
    return res.redirect(authUrl);
  }

  /**
   * OAuth callback — Instagram redirects here with code
   * GET /api/v1/integrations/instagram/callback?code=xxx&state=xxx
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    // Parse state to get userId and redirect destination
    let userId: string;
    let redirectPath = '/app/instagram';
    let redirectBase = this.businessFrontendUrl;

    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      userId = parsed.userId;
      if (parsed.redirect) redirectPath = parsed.redirect;
      if (parsed.redirectBase) redirectBase = parsed.redirectBase;
    } catch {
      // Fallback: state is just base64-encoded userId (legacy)
      userId = Buffer.from(state, 'base64url').toString('utf8');
    }

    const fullRedirect = `${redirectBase}${redirectPath}`;

    if (error || !code) {
      return res.redirect(
        `${fullRedirect}?instagram=error&reason=${error ?? 'no_code'}`,
      );
    }

    try {
      const result = await this.instagramService.exchangeCodeAndSave(
        code,
        userId,
      );
      return res.redirect(
        `${fullRedirect}?instagram=success&username=${result.username}`,
      );
    } catch (err: any) {
      console.error('[Instagram OAuth callback error]', err?.message);
      return res.redirect(`${fullRedirect}?instagram=error&reason=server`);
    }
  }

  // ─── Connection endpoints ─────────────────────────────────

  /**
   * Get all Instagram connections for current user
   * GET /api/v1/integrations/instagram/connections
   */
  @Get('connections')
  @UseGuards(JwtAuthGuard)
  async getConnections(@Req() req: any) {
    const connections = await this.instagramService.getConnections(req.user.id);
    return { connections };
  }

  /**
   * Legacy: Get first connection status
   * GET /api/v1/integrations/instagram/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any) {
    const connection = await this.instagramService.getConnection(req.user.id);
    return { connected: !!connection, connection };
  }

  /**
   * Get a single connection by ID
   * GET /api/v1/integrations/instagram/connections/:connectionId
   */
  @Get('connections/:connectionId')
  @UseGuards(JwtAuthGuard)
  async getConnectionById(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    const connection = await this.instagramService.getConnectionById(
      req.user.id,
      connectionId,
    );
    if (!connection) {
      return { connected: false, connection: null };
    }
    return { connected: true, connection };
  }

  /**
   * Refresh long-lived token for a specific connection
   * GET /api/v1/integrations/instagram/connections/:connectionId/refresh
   */
  @Get('connections/:connectionId/refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.instagramService.refreshToken(req.user.id, connectionId);
  }

  /**
   * Fetch recent media for a specific connection
   * GET /api/v1/integrations/instagram/connections/:connectionId/media
   */
  @Get('connections/:connectionId/media')
  @UseGuards(JwtAuthGuard)
  async getMedia(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
    @Query('limit') limit?: string,
  ) {
    return this.instagramService.getMedia(
      req.user.id,
      connectionId,
      limit ? parseInt(limit, 10) : 12,
    );
  }

  /**
   * Disconnect a specific Instagram connection
   * DELETE /api/v1/integrations/instagram/connections/:connectionId
   */
  @Delete('connections/:connectionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disconnect(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.instagramService.disconnect(req.user.id, connectionId);
  }

  // ─── Legacy endpoint (backwards compat) ───────────────────

  /**
   * @deprecated Use DELETE /connections/:connectionId instead
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disconnectLegacy(@Req() req: any) {
    const connection = await this.instagramService.getConnection(req.user.id);
    if (!connection) return { success: true };
    return this.instagramService.disconnect(req.user.id, connection.id);
  }

  /**
   * @deprecated Use GET /connections/:connectionId/media instead
   */
  @Get('media')
  @UseGuards(JwtAuthGuard)
  async getMediaLegacy(@Req() req: any, @Query('limit') limit?: string) {
    const connection = await this.instagramService.getConnection(req.user.id);
    if (!connection) return { data: [] };
    return this.instagramService.getMedia(
      req.user.id,
      connection.id,
      limit ? parseInt(limit, 10) : 12,
    );
  }

  /**
   * @deprecated Use GET /connections/:connectionId/refresh instead
   */
  @Get('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshLegacy(@Req() req: any) {
    const connection = await this.instagramService.getConnection(req.user.id);
    if (!connection) return { success: false };
    return this.instagramService.refreshToken(req.user.id, connection.id);
  }

  // ─── Webhook endpoints (required by Facebook) ─────────────

  /**
   * Instagram deauthorize callback
   * POST /api/v1/integrations/instagram/deauthorize
   */
  @Post('deauthorize')
  @HttpCode(HttpStatus.OK)
  async deauthorize(@Body() body: { signed_request?: string }) {
    return this.instagramService.handleDeauthorize(body);
  }

  /**
   * Data deletion request callback
   * POST /api/v1/integrations/instagram/data-deletion
   */
  @Post('data-deletion')
  @HttpCode(HttpStatus.OK)
  async dataDeletion() {
    return this.instagramService.handleDataDeletion();
  }

  // ─── Insights & Comments ─────────────────────────────────

  /**
   * Fetch account insights (reach, impressions, profile_views)
   * GET /api/v1/integrations/instagram/connections/:connectionId/insights
   */
  @Get('connections/:connectionId/insights')
  @UseGuards(JwtAuthGuard)
  async getInsights(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
    @Query('metric') metric?: string,
  ) {
    return this.instagramService.getInsights(req.user.id, connectionId, metric);
  }

  /**
   * Get comments for a connection (from our DB)
   * GET /api/v1/integrations/instagram/connections/:connectionId/comments
   */
  @Get('connections/:connectionId/comments')
  @UseGuards(JwtAuthGuard)
  async getComments(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    const comments = await this.instagramService.getComments(req.user.id, connectionId);
    return { comments };
  }

  /**
   * Sync existing historical comments from Meta API
   * POST /api/v1/integrations/instagram/connections/:connectionId/comments/sync
   */
  @Post('connections/:connectionId/comments/sync')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncComments(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.instagramService.syncComments(req.user.id, connectionId);
  }

  /**
   * Reply to a comment
   * POST /api/v1/integrations/instagram/connections/:connectionId/comments/:commentId/reply
   */
  @Post('connections/:connectionId/comments/:commentId/reply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async replyToComment(
    @Req() req: any,
    @Param('connectionId') connectionId: string,
    @Param('commentId') commentId: string,
    @Body('message') message: string,
  ) {
    return this.instagramService.replyToComment(req.user.id, connectionId, commentId, message);
  }

  // ─── Meta Webhook ─────────────────────────────────────────

  /**
   * Webhook verification (GET) — Meta sends a challenge
   * GET /api/v1/integrations/instagram/webhook
   */
  @Get('webhook')
  async webhookVerify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.config.get<string>('INSTAGRAM_WEBHOOK_VERIFY_TOKEN') || 'rukny_ig_webhook';
    if (mode === 'subscribe' && verifyToken === expectedToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  /**
   * Webhook event handler (POST) — Meta sends comment/message events
   * POST /api/v1/integrations/instagram/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhookEvent(@Body() body: any) {
    return this.instagramService.handleWebhookEvent(body);
  }

  /**
   * Manual connect with access token
   * POST /api/v1/integrations/instagram/manual-connect
   */
  @Post('manual-connect')
  @UseGuards(JwtAuthGuard)
  async manualConnect(
    @Req() req: any,
    @Body('accessToken') accessToken: string,
  ) {
    return this.instagramService.connectWithToken(accessToken, req.user.id);
  }

  // ─── Block endpoints ─────────────────────────────────────

  @Post('blocks')
  @UseGuards(JwtAuthGuard)
  async createBlock(@Req() req: any, @Body('type') type: 'GRID' | 'FEED') {
    return this.instagramService.createBlock(req.user.id, type);
  }

  @Get('blocks')
  @UseGuards(JwtAuthGuard)
  async getBlocks(@Req() req: any) {
    return this.instagramService.getBlocks(req.user.id);
  }

  @Get('blocks/public/:userId')
  async getPublicBlocks(@Param('userId') userId: string) {
    const [blocks, media, connection] = await Promise.all([
      this.instagramService.getActiveBlocks(userId),
      this.instagramService.getPublicMedia(userId),
      this.instagramService.getConnection(userId),
    ]);

    const publicConnection = connection
      ? {
          username: connection.username,
          name: connection.name,
          profilePicUrl: connection.profilePicUrl,
          followersCount: connection.followersCount,
        }
      : null;

    return { blocks, media, connection: publicConnection };
  }

  @Patch('blocks/:blockId/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleBlock(@Req() req: any, @Param('blockId') blockId: string) {
    return this.instagramService.toggleBlock(req.user.id, blockId);
  }

  @Delete('blocks/:blockId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteBlock(@Req() req: any, @Param('blockId') blockId: string) {
    return this.instagramService.deleteBlock(req.user.id, blockId);
  }

  @Patch('blocks/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderBlocks(@Req() req: any, @Body() body: { blockIds: string[] }) {
    return this.instagramService.reorderBlocks(req.user.id, body.blockIds);
  }

  @Post('blocks/:blockId/grid-links')
  @UseGuards(JwtAuthGuard)
  async setGridLink(
    @Req() req: any,
    @Param('blockId') blockId: string,
    @Body() body: { mediaId: string; linkUrl: string; linkTitle?: string },
  ) {
    return this.instagramService.setGridLink(
      req.user.id,
      blockId,
      body.mediaId,
      body.linkUrl,
      body.linkTitle,
    );
  }

  @Delete('blocks/:blockId/grid-links/:mediaId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeGridLink(
    @Req() req: any,
    @Param('blockId') blockId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.instagramService.removeGridLink(req.user.id, blockId, mediaId);
  }
}
