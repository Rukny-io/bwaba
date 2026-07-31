import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USERINFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const TIKTOK_VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';

@Injectable()
export class TikTokService {
  private readonly clientKey: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string;

  private get tikTokConnectionModel(): any {
    return (this.prisma as any).tikTokConnection;
  }

  private get tikTokBlockModel(): any {
    return (this.prisma as any).tikTokBlock;
  }

  private hasTikTokModels(): boolean {
    return Boolean(this.tikTokConnectionModel && this.tikTokBlockModel);
  }

  private isMissingRelationError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return (
      message.includes('does not exist in the current database') ||
      message.includes('relation "public.tiktok_connections" does not exist') ||
      message.includes('relation "public.tiktok_blocks" does not exist')
    );
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.clientKey = this.config.get<string>('TIKTOK_CLIENT_KEY') ?? '';
    this.clientSecret = this.config.get<string>('TIKTOK_CLIENT_SECRET') ?? '';
    this.redirectUri = this.config.get<string>('TIKTOK_INTEGRATION_CALLBACK_URL') ?? '';
    this.scopes =
      this.config.get<string>('TIKTOK_SCOPES') ??
      'user.info.basic,user.info.profile,user.info.stats,video.list';
  }

  private ensureConfigured() {
    const missing: string[] = [];
    if (!this.clientKey) missing.push('TIKTOK_CLIENT_KEY');
    if (!this.clientSecret) missing.push('TIKTOK_CLIENT_SECRET');
    if (!this.redirectUri) missing.push('TIKTOK_INTEGRATION_CALLBACK_URL');
    if (missing.length > 0) {
      throw new BadRequestException(
        `TikTok integration is not configured. Missing: ${missing.join(', ')}`,
      );
    }
  }

  getAuthUrl(state: string) {
    this.ensureConfigured();
    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: this.scopes.replace(/\s+/g, ''),
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state,
    });
    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeAndSave(code: string, userId: string) {
    this.ensureConfigured();

    const form = new URLSearchParams({
      client_key: this.clientKey,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    const tokenRes = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new BadRequestException(`TikTok token exchange failed: ${err}`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      open_id?: string;
      union_id?: string;
    };

    if (!tokenData.access_token) {
      throw new BadRequestException('TikTok access token not found');
    }

    const profile = await this.fetchProfile(tokenData.access_token);
    const tokenExpiry =
      typeof tokenData.expires_in === 'number'
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

    await this.tikTokConnectionModel.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        tokenExpiry,
        openId: profile.openId || tokenData.open_id || '',
        unionId: profile.unionId || tokenData.union_id || null,
        displayName: profile.displayName || 'TikTok User',
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
        isVerified: profile.isVerified,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        likes: profile.likes,
        videoCount: profile.videoCount,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        tokenExpiry,
        openId: profile.openId || tokenData.open_id || '',
        unionId: profile.unionId || tokenData.union_id || null,
        displayName: profile.displayName || 'TikTok User',
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
        isVerified: profile.isVerified,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        likes: profile.likes,
        videoCount: profile.videoCount,
      },
    });

    return { success: true, displayName: profile.displayName || 'TikTok User' };
  }

  async getConnection(userId: string) {
    if (!this.hasTikTokModels()) return null;
    try {
      const conn = await this.tikTokConnectionModel.findUnique({
        where: { userId },
        select: {
          openId: true,
          displayName: true,
          avatarUrl: true,
          profileUrl: true,
          isVerified: true,
          bio: true,
          followers: true,
          following: true,
          likes: true,
          videoCount: true,
          tokenExpiry: true,
          createdAt: true,
        },
      });
      return conn ?? null;
    } catch (error) {
      console.error('[TikTok] getConnection failed:', error);
      return null;
    }
  }

  async disconnect(userId: string) {
    if (!this.hasTikTokModels()) {
      throw new BadRequestException('TikTok integration is unavailable');
    }
    try {
      await this.tikTokConnectionModel.delete({ where: { userId } });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
    return { success: true };
  }

  async createBlock(userId: string, type: 'FEED') {
    if (!this.hasTikTokModels()) {
      throw new BadRequestException('TikTok integration is unavailable');
    }
    let conn: any = null;
    try {
      conn = await this.tikTokConnectionModel.findUnique({ where: { userId } });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
    if (!conn) throw new BadRequestException('يجب ربط حساب TikTok أولاً');

    // اجعل إنشاء البلوك idempotent لتفادي فشل الواجهة إذا كان FEED
    // قد تم إنشاؤه مسبقاً (مثلاً مباشرة بعد OAuth callback).
    let existing: any = null;
    try {
      existing = await this.tikTokBlockModel.findFirst({
        where: { userId, type },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
    if (existing) {
      return existing;
    }

    let maxOrder: { _max: { displayOrder: number | null } };
    try {
      maxOrder = await this.tikTokBlockModel.aggregate({
        where: { userId },
        _max: { displayOrder: true },
      });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }

    try {
      return await this.tikTokBlockModel.create({
        data: {
          userId,
          type,
          displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
        },
      });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
  }

  async getBlocks(userId: string) {
    if (!this.hasTikTokModels()) return [];
    try {
      return await this.tikTokBlockModel.findMany({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      console.error('[TikTok] getBlocks failed:', error);
      return [];
    }
  }

  async getActiveBlocks(userId: string) {
    if (!this.hasTikTokModels()) return [];
    try {
      return await this.tikTokBlockModel.findMany({
        where: { userId, isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      console.error('[TikTok] getActiveBlocks failed:', error);
      return [];
    }
  }

  async toggleBlock(userId: string, blockId: string) {
    if (!this.hasTikTokModels()) {
      throw new BadRequestException('TikTok integration is unavailable');
    }
    let block: any = null;
    try {
      block = await this.tikTokBlockModel.findFirst({ where: { id: blockId, userId } });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
    if (!block) throw new NotFoundException('البلوك غير موجود');
    try {
      return await this.tikTokBlockModel.update({
        where: { id: blockId },
        data: { isActive: !block.isActive },
      });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
  }

  async deleteBlock(userId: string, blockId: string) {
    if (!this.hasTikTokModels()) {
      throw new BadRequestException('TikTok integration is unavailable');
    }
    let block: any = null;
    try {
      block = await this.tikTokBlockModel.findFirst({ where: { id: blockId, userId } });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
    if (!block) throw new NotFoundException('البلوك غير موجود');
    try {
      await this.tikTokBlockModel.delete({ where: { id: blockId } });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        throw new BadRequestException('TikTok tables are not migrated yet');
      }
      throw error;
    }
    return { success: true };
  }

  async getMedia(userId: string, maxCount = 12) {
    if (!this.hasTikTokModels()) return { data: [] };
    let conn: { accessToken: string; openId: string } | null = null;
    try {
      conn = await this.tikTokConnectionModel.findUnique({
        where: { userId },
        select: { accessToken: true, openId: true },
      });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        return { data: [] };
      }
      throw error;
    }
    if (!conn) return { data: [] };

    const list = await this.fetchVideos(conn.accessToken, conn.openId, maxCount);
    return { data: list };
  }

  async getPublicData(userId: string) {
    if (!this.hasTikTokModels()) {
      return {
        profile: null,
        blocks: [],
        media: { data: [] },
      };
    }
    let conn: any = null;
    try {
      conn = await this.tikTokConnectionModel.findUnique({
        where: { userId },
        select: {
          accessToken: true,
          openId: true,
          displayName: true,
          avatarUrl: true,
          profileUrl: true,
          isVerified: true,
          bio: true,
          followers: true,
          following: true,
          likes: true,
          videoCount: true,
        },
      });
    } catch (error) {
      if (this.isMissingRelationError(error)) {
        return {
          profile: null,
          blocks: [],
          media: { data: [] },
        };
      }
      throw error;
    }

    const blocks = await this.getActiveBlocks(userId);
    const media =
      conn?.accessToken && conn?.openId && blocks.length > 0
        ? await this.fetchVideos(conn.accessToken, conn.openId, 12)
        : [];

    return {
      profile: conn
        ? {
            displayName: conn.displayName,
            avatarUrl: conn.avatarUrl,
            profileUrl: conn.profileUrl,
            isVerified: conn.isVerified,
            bio: conn.bio,
            followers: conn.followers,
            following: conn.following,
            likes: conn.likes,
            videoCount: conn.videoCount,
          }
        : null,
      blocks,
      media: { data: media },
    };
  }

  private async fetchProfile(accessToken: string) {
    const fields = [
      'open_id',
      'union_id',
      'display_name',
      'avatar_url',
      'profile_deep_link',
      'bio_description',
      'is_verified',
      'follower_count',
      'following_count',
      'likes_count',
      'video_count',
    ].join(',');
    const res = await fetch(`${TIKTOK_USERINFO_URL}?fields=${encodeURIComponent(fields)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`TikTok profile fetch failed: ${err}`);
    }

    const payload = (await res.json()) as {
      data?: {
        user?: Record<string, any>;
      };
    };
    const user = payload?.data?.user ?? {};
    return {
      openId: (user.open_id as string) || '',
      unionId: (user.union_id as string) || null,
      displayName: (user.display_name as string) || 'TikTok User',
      avatarUrl: (user.avatar_url as string) || null,
      profileUrl: (user.profile_deep_link as string) || null,
      isVerified: Boolean(user.is_verified),
      bio: (user.bio_description as string) || null,
      followers:
        typeof user.follower_count === 'number' ? (user.follower_count as number) : null,
      following:
        typeof user.following_count === 'number' ? (user.following_count as number) : null,
      likes: typeof user.likes_count === 'number' ? (user.likes_count as number) : null,
      videoCount:
        typeof user.video_count === 'number' ? (user.video_count as number) : null,
    };
  }

  private async fetchVideos(accessToken: string, openId: string, maxCount = 12) {
    const fields = ['id', 'title', 'video_description', 'duration', 'cover_image_url', 'share_url', 'create_time'].join(',');
    try {
      const res = await fetch(`${TIKTOK_VIDEO_LIST_URL}?fields=${encodeURIComponent(fields)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          open_id: openId,
          max_count: Math.min(Math.max(maxCount, 1), 20),
        }),
      });
      if (!res.ok) return [];
      const payload = (await res.json()) as {
        data?: { videos?: Array<Record<string, any>> };
      };
      const videos = Array.isArray(payload?.data?.videos) ? payload.data!.videos! : [];
      return videos.map((item) => ({
        id: String(item.id ?? ''),
        title: (item.title as string) || (item.video_description as string) || null,
        coverImageUrl: (item.cover_image_url as string) || null,
        shareUrl: (item.share_url as string) || null,
        createTime: (item.create_time as string) || null,
      })).filter((v) => v.id);
    } catch {
      return [];
    }
  }
}
