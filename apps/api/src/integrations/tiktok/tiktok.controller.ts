import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { TikTokService } from './tiktok.service';

@Controller('integrations/tiktok')
export class TikTokController {
  private readonly appFrontendUrl: string;

  constructor(
    private readonly tikTokService: TikTokService,
    private readonly config: ConfigService,
  ) {
    this.appFrontendUrl =
      this.config.get<string>('APP_FRONTEND_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      this.config.get<string>('FRONTEND_URL_DEV') ||
      'http://localhost:3000';
  }

  @Get('auth')
  @UseGuards(JwtAuthGuard)
  async authorize(@Req() req: any, @Res() res: Response) {
    const state = Buffer.from(req.user.id).toString('base64url');
    const authUrl = this.tikTokService.getAuthUrl(state);
    return res.redirect(authUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const redirectBase = `${this.appFrontendUrl}/links`;
    if (error || !code) {
      return res.redirect(`${redirectBase}?tiktok=error&reason=${error ?? 'no_code'}`);
    }
    try {
      const userId = Buffer.from(state, 'base64url').toString('utf8');
      const result = await this.tikTokService.exchangeCodeAndSave(code, userId);

      try {
        const existing = await this.tikTokService.getBlocks(userId);
        if (existing.length === 0) {
          await this.tikTokService.createBlock(userId, 'FEED');
        }
      } catch {
        // non-critical
      }

      return res.redirect(
        `${redirectBase}?tiktok=success&name=${encodeURIComponent(result.displayName)}`,
      );
    } catch (err: any) {
      console.error('[TikTok OAuth callback error]', err?.message);
      return res.redirect(`${redirectBase}?tiktok=error&reason=server`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any) {
    const connection = await this.tikTokService.getConnection(req.user.id);
    return { connected: !!connection, connection };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disconnect(@Req() req: any) {
    return this.tikTokService.disconnect(req.user.id);
  }

  @Get('media')
  @UseGuards(JwtAuthGuard)
  async getMedia(@Req() req: any, @Query('limit') limit?: string) {
    return this.tikTokService.getMedia(req.user.id, limit ? parseInt(limit, 10) : 12);
  }

  @Get('blocks')
  @UseGuards(JwtAuthGuard)
  async getBlocks(@Req() req: any) {
    return this.tikTokService.getBlocks(req.user.id);
  }

  @Get('blocks/public/:userId')
  async getPublicBlocks(@Param('userId') userId: string) {
    return this.tikTokService.getPublicData(userId);
  }

  @Delete('blocks/:blockId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteBlock(@Req() req: any, @Param('blockId') blockId: string) {
    return this.tikTokService.deleteBlock(req.user.id, blockId);
  }

  @Patch('blocks/:blockId/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleBlock(@Req() req: any, @Param('blockId') blockId: string) {
    return this.tikTokService.toggleBlock(req.user.id, blockId);
  }

  @Post('blocks')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createBlock(@Req() req: any, @Body('type') type: 'FEED') {
    return this.tikTokService.createBlock(req.user.id, type);
  }
}
