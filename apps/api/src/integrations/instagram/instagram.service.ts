import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CacheManager } from '../../core/cache/cache.manager';
import { generateSocialLinkId } from '../../core/common/utils/secure-id.util';
import { InstagramInboxService } from './instagram-inbox.service';
import { enableInstagramWebhookSubscriptions } from './instagram-webhook.util';

const IG_OAUTH_BASE = 'https://www.instagram.com/oauth/authorize';
const IG_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const IG_LONG_LIVED_URL = 'https://graph.instagram.com/access_token';
const IG_REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';
const IG_GRAPH_BASE = 'https://graph.instagram.com/v22.0';
/** Fields supported by Instagram API with Instagram Login (/me). */
const IG_ME_PROFILE_FIELDS =
  'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count';

@Injectable()
export class InstagramService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  // Type workaround for monorepo Prisma type cache mismatch in editor.
  private get instagramConnectionModel(): any {
    return (this.prisma as any).instagramConnection;
  }
  
  private get instagramCommentModel(): any {
    return (this.prisma as any).instagramComment;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cacheManager: CacheManager,
    private readonly instagramInboxService: InstagramInboxService,
  ) {
    this.appId = this.config.get<string>('INSTAGRAM_APP_ID') ?? '';
    this.appSecret = this.config.get<string>('INSTAGRAM_APP_SECRET') ?? '';
    this.redirectUri = this.config.get<string>('INSTAGRAM_REDIRECT_URI') ?? '';
  }

  private ensureConfigured() {
    const missing: string[] = [];
    if (!this.appId) missing.push('INSTAGRAM_APP_ID');
    if (!this.appSecret) missing.push('INSTAGRAM_APP_SECRET');
    if (!this.redirectUri) missing.push('INSTAGRAM_REDIRECT_URI');

    if (missing.length > 0) {
      throw new BadRequestException(
        `Instagram integration is not configured. Missing: ${missing.join(', ')}`,
      );
    }
  }

  private readonly oauthScopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights',
  ] as const;

  /** Non-secret OAuth config for Meta dashboard alignment checks. */
  getOAuthSetup() {
    this.ensureConfigured();

    return {
      clientId: this.appId,
      redirectUri: this.redirectUri,
      authorizeEndpoint: IG_OAUTH_BASE,
      scopes: [...this.oauthScopes],
      metaDashboardPath:
        'Instagram → API setup with Instagram login → Set up Instagram business login → Business login settings → OAuth redirect URIs',
      metaAppUrl: `https://developers.facebook.com/apps/${this.appId}/`,
      sampleAuthorizeUrl: this.getAuthUrl('setup-preview'),
      notes: [
        'Use the Instagram App ID from Business login settings (not Facebook Login redirect URIs).',
        'redirect_uri must match character-for-character, including https, host, port, and path.',
      ],
    };
  }

  /** Build OAuth authorization URL */
  getAuthUrl(state: string): string {
    this.ensureConfigured();

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.oauthScopes.join(','),
      state,
    });

    return `${IG_OAUTH_BASE}?${params.toString()}`;
  }

  /** Exchange code → short-lived token → long-lived token → save */
  async exchangeCodeAndSave(code: string, userId: string) {
    this.ensureConfigured();

    // 1. Short-lived token
    const formData = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
      code,
    });

    const shortRes = await fetch(IG_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!shortRes.ok) {
      const err = await shortRes.text();
      throw new BadRequestException(`Instagram token exchange failed: ${err}`);
    }

    const { access_token: shortToken, user_id: igUserId } =
      (await shortRes.json()) as {
        access_token: string;
        user_id: string;
      };

    // 2. Long-lived token
    const longParams = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.appSecret,
      access_token: shortToken,
    });

    const longRes = await fetch(
      `${IG_LONG_LIVED_URL}?${longParams.toString()}`,
    );

    if (!longRes.ok) {
      const err = await longRes.text();
      throw new BadRequestException(
        `Instagram long-lived token failed: ${err}`,
      );
    }

    const { access_token: longToken, expires_in: expiresIn } =
      (await longRes.json()) as {
        access_token: string;
        expires_in: number;
      };

    // 3. Fetch user profile via /me (Instagram Login) — not /{user_id}
    const profileParams = new URLSearchParams({
      fields: IG_ME_PROFILE_FIELDS,
      access_token: longToken,
    });

    const profileRes = await fetch(
      `${IG_GRAPH_BASE}/me?${profileParams.toString()}`,
    );

    const profileBody = await profileRes.text();
    if (!profileRes.ok) {
      console.error(
        '[Instagram profile fetch failed]',
        profileRes.status,
        profileBody.slice(0, 500),
      );
      throw new BadRequestException(
        'فشل جلب بيانات حساب إنستغرام. تأكد أن الحساب احترافي (Business/Creator) وأن صلاحيات التطبيق مكتملة، ثم أعد المحاولة.',
      );
    }

    let profile: {
      user_id?: string;
      username?: string;
      name?: string;
      profile_picture_url?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
    };
    try {
      profile = JSON.parse(profileBody) as typeof profile;
    } catch {
      throw new BadRequestException(
        'فشل قراءة استجابة إنستغرام. أعد المحاولة.',
      );
    }

    if (
      !profile.username ||
      typeof profile.username !== 'string' ||
      !profile.username.trim()
    ) {
      console.error(
        '[Instagram profile missing username]',
        profileBody.slice(0, 500),
      );
      throw new BadRequestException(
        'فشل جلب بيانات حساب إنستغرام. تأكد أن الحساب احترافي (Business/Creator) وأعد المحاولة.',
      );
    }

    const resolvedIgUserId = String(profile.user_id ?? igUserId);
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    // 4. Upsert connection (unique on userId + igUserId)
    const connection = await this.instagramConnectionModel.upsert({
      where: {
        userId_igUserId: { userId, igUserId: resolvedIgUserId },
      },
      create: {
        userId,
        accessToken: longToken,
        tokenExpiry,
        igUserId: resolvedIgUserId,
        username: profile.username ?? '',
        name: profile.name ?? null,
        profilePicUrl: profile.profile_picture_url ?? null,
        biography: null,
        website: null,
        followersCount: profile.followers_count ?? null,
        followsCount: profile.follows_count ?? null,
        mediaCount: profile.media_count ?? null,
      },
      update: {
        accessToken: longToken,
        tokenExpiry,
        username: profile.username ?? '',
        name: profile.name ?? null,
        profilePicUrl: profile.profile_picture_url ?? null,
        followersCount: profile.followers_count ?? null,
        followsCount: profile.follows_count ?? null,
        mediaCount: profile.media_count ?? null,
      },
    });

    void this.enableInboxWebhookSubscriptions(longToken);

    return {
      success: true,
      username: profile.username,
      connectionId: connection.id,
      name: profile.name ?? null,
      profilePicUrl: profile.profile_picture_url ?? null,
    };
  }

  // ─── Connection queries ─────────────────────────────────────

  /**
   * Get ALL Instagram connections for a user (multi-account).
   */
  async getConnections(userId: string) {
    const connections = await this.instagramConnectionModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // Lazy refresh profile snapshots in the background
    const now = Date.now();
    for (const conn of connections) {
      const updatedAt = conn.updatedAt ? new Date(conn.updatedAt).getTime() : 0;
      const ageMs = now - updatedAt;
      const PROFILE_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
      const tokenStillValid =
        !conn.tokenExpiry || new Date(conn.tokenExpiry).getTime() > now;

      if (ageMs > PROFILE_SNAPSHOT_TTL_MS && tokenStillValid) {
        void this.syncProfileSnapshot(conn.id, conn.accessToken).catch(() => null);
      }
    }

    return connections.map((c: any) => this.toPublicConnection(c));
  }

  /**
   * Get a single connection by its ID (must belong to user).
   */
  async getConnectionById(userId: string, connectionId: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) return null;

    const now = Date.now();
    const updatedAt = conn.updatedAt ? new Date(conn.updatedAt).getTime() : 0;
    const ageMs = now - updatedAt;
    const PROFILE_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
    const FORCE_AWAIT_MS = 7 * 24 * 60 * 60 * 1000;
    const tokenStillValid =
      !conn.tokenExpiry || new Date(conn.tokenExpiry).getTime() > now;

    if (ageMs > PROFILE_SNAPSHOT_TTL_MS && tokenStillValid) {
      if (ageMs > FORCE_AWAIT_MS) {
        const refreshed = await this.syncProfileSnapshot(conn.id, conn.accessToken);
        if (refreshed) return this.toPublicConnection(refreshed);
      } else {
        void this.syncProfileSnapshot(conn.id, conn.accessToken).catch(() => null);
      }
    }

    return this.toPublicConnection(conn);
  }

  /**
   * Legacy: get first connection for a user (backwards compat).
   */
  async getConnection(userId: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!conn) return null;

    const now = Date.now();
    const updatedAt = conn.updatedAt ? new Date(conn.updatedAt).getTime() : 0;
    const ageMs = now - updatedAt;
    const PROFILE_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
    const FORCE_AWAIT_MS = 7 * 24 * 60 * 60 * 1000;

    const tokenStillValid =
      !conn.tokenExpiry || new Date(conn.tokenExpiry).getTime() > now;

    if (ageMs > PROFILE_SNAPSHOT_TTL_MS && tokenStillValid) {
      if (ageMs > FORCE_AWAIT_MS) {
        const refreshed = await this.syncProfileSnapshot(conn.id, conn.accessToken);
        if (refreshed) {
          return this.toPublicConnection(refreshed);
        }
      } else {
        void this.syncProfileSnapshot(conn.id, conn.accessToken).catch(() => null);
      }
    }

    return this.toPublicConnection(conn);
  }

  private toPublicConnection(conn: any) {
    return {
      id: conn.id,
      igUserId: conn.igUserId,
      username: conn.username,
      name: conn.name,
      profilePicUrl: conn.profilePicUrl,
      biography: conn.biography ?? null,
      website: conn.website ?? null,
      followersCount: conn.followersCount,
      followsCount: conn.followsCount ?? null,
      mediaCount: conn.mediaCount,
      tokenExpiry: conn.tokenExpiry,
      createdAt: conn.createdAt,
    };
  }

  // ─── Profile snapshot ─────────────────────────────────────

  private async fetchProfileSnapshot(accessToken: string): Promise<{
    username?: string;
    name?: string | null;
    profile_picture_url?: string | null;
    biography?: string | null;
    website?: string | null;
    followers_count?: number | null;
    follows_count?: number | null;
    media_count?: number | null;
  } | null> {
    const params = new URLSearchParams({
      fields: IG_ME_PROFILE_FIELDS,
      access_token: accessToken,
    });
    try {
      const res = await fetch(`${IG_GRAPH_BASE}/me?${params.toString()}`);
      if (!res.ok) {
        console.error(
          '[Instagram profile snapshot failed]',
          res.status,
          (await res.text()).slice(0, 300),
        );
        return null;
      }
      return (await res.json()) as {
        username?: string;
        name?: string | null;
        profile_picture_url?: string | null;
        biography?: string | null;
        website?: string | null;
        followers_count?: number | null;
        follows_count?: number | null;
        media_count?: number | null;
      };
    } catch {
      return null;
    }
  }

  private async syncProfileSnapshot(connectionId: string, accessToken: string) {
    const profile = await this.fetchProfileSnapshot(accessToken);
    if (!profile || !profile.username) return null;

    return this.instagramConnectionModel.update({
      where: { id: connectionId },
      data: {
        username: profile.username,
        name: profile.name ?? null,
        profilePicUrl: profile.profile_picture_url ?? null,
        biography: profile.biography ?? null,
        website: profile.website ?? null,
        followersCount: profile.followers_count ?? null,
        followsCount: profile.follows_count ?? null,
        mediaCount: profile.media_count ?? null,
      },
    });
  }

  // ─── Token management ─────────────────────────────────────

  /** Refresh long-lived token for a specific connection */
  async refreshToken(userId: string, connectionId: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });

    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: conn.accessToken,
    });

    const res = await fetch(`${IG_REFRESH_URL}?${params.toString()}`);

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Token refresh failed: ${err}`);
    }

    const { access_token, expires_in } = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    await this.instagramConnectionModel.update({
      where: { id: connectionId },
      data: { accessToken: access_token, tokenExpiry },
    });

    await this.syncProfileSnapshot(connectionId, access_token);

    return { success: true };
  }

  /** Disconnect a specific Instagram connection */
  async disconnect(userId: string, connectionId: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    await this.instagramConnectionModel.delete({
      where: { id: connectionId },
    });
    return { success: true };
  }

  // ─── Media ────────────────────────────────────────────────

  /** Fetch recent media for a specific connection */
  async getMedia(userId: string, connectionId: string, limit = 12) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    if (conn.tokenExpiry && new Date(conn.tokenExpiry) < new Date()) {
      throw new BadRequestException({
        message: 'انتهت صلاحية توكن إنستغرام. يرجى إعادة ربط حسابك.',
        tokenExpired: true,
      });
    }

    const params = new URLSearchParams({
      fields:
        'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count',
      limit: String(limit),
      access_token: conn.accessToken,
    });

    const res = await fetch(
      `${IG_GRAPH_BASE}/${conn.igUserId}/media?${params.toString()}`,
    );

    if (!res.ok) {
      const errText = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(errText);
      } catch {
        /* ignore */
      }
      const igCode = parsed?.error?.code;
      const igSubcode = parsed?.error?.error_subcode;

      if (igCode === 190 || (igCode === 100 && igSubcode === 33)) {
        throw new BadRequestException({
          message:
            'توكن إنستغرام غير صالح أو منتهي الصلاحية. يرجى إلغاء الربط وإعادة الربط.',
          tokenExpired: true,
          igError: parsed?.error,
        });
      }

      throw new BadRequestException(
        `Failed to fetch Instagram media: ${errText}`,
      );
    }

    return res.json();
  }

  // ─── Instagram Blocks ───────────────────────────────────────

  private get instagramBlockModel(): any {
    return (this.prisma as any).instagramBlock;
  }

  private get instagramGridLinkModel(): any {
    return (this.prisma as any).instagramGridLink;
  }

  /** Create an Instagram block (GRID or FEED) */
  async createBlock(userId: string, type: 'GRID' | 'FEED') {
    // Ensure user has at least one Instagram connection
    const conn = await this.instagramConnectionModel.findFirst({
      where: { userId },
    });
    if (!conn) throw new BadRequestException('يجب ربط حساب إنستغرام أولاً');

    const maxOrder = await this.instagramBlockModel.aggregate({
      where: { userId },
      _max: { displayOrder: true },
    });

    return this.instagramBlockModel.create({
      data: {
        userId,
        type,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });
  }

  /** Get all instagram blocks for a user */
  async getBlocks(userId: string) {
    return this.instagramBlockModel.findMany({
      where: { userId },
      include: { gridLinks: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /** Get active instagram blocks for a user (public profile) */
  async getActiveBlocks(userId: string) {
    return this.instagramBlockModel.findMany({
      where: { userId, isActive: true },
      include: { gridLinks: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /** Delete an instagram block */
  async deleteBlock(userId: string, blockId: string) {
    const block = await this.instagramBlockModel.findFirst({
      where: { id: blockId, userId },
    });
    if (!block) throw new NotFoundException('البلوك غير موجود');

    await this.instagramBlockModel.delete({ where: { id: blockId } });
    return { success: true };
  }

  /** Toggle block active status */
  async toggleBlock(userId: string, blockId: string) {
    const block = await this.instagramBlockModel.findFirst({
      where: { id: blockId, userId },
    });
    if (!block) throw new NotFoundException('البلوك غير موجود');

    return this.instagramBlockModel.update({
      where: { id: blockId },
      data: { isActive: !block.isActive },
    });
  }

  /** Reorder blocks for a user */
  async reorderBlocks(userId: string, blockIds: string[]) {
    if (!Array.isArray(blockIds) || blockIds.length === 0) {
      throw new BadRequestException('قائمة البلوكات مطلوبة');
    }

    const existing = await this.instagramBlockModel.findMany({
      where: {
        userId,
        id: { in: blockIds },
      },
      select: { id: true },
    });

    if (existing.length !== blockIds.length) {
      throw new BadRequestException(
        'بعض البلوكات غير صالحة أو لا تخص المستخدم',
      );
    }

    await this.prisma.$transaction(
      blockIds.map((id, index) =>
        this.instagramBlockModel.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );

    return this.instagramBlockModel.findMany({
      where: { userId },
      include: { gridLinks: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /** Set/update a grid link for a specific media item */
  async setGridLink(
    userId: string,
    blockId: string,
    mediaId: string,
    linkUrl: string,
    linkTitle?: string,
  ) {
    const block = await this.instagramBlockModel.findFirst({
      where: { id: blockId, userId, type: 'GRID' },
    });
    if (!block) throw new NotFoundException('البلوك غير موجود');

    return this.instagramGridLinkModel.upsert({
      where: { blockId_mediaId: { blockId, mediaId } },
      create: { blockId, mediaId, linkUrl, linkTitle },
      update: { linkUrl, linkTitle },
    });
  }

  /** Remove a grid link */
  async removeGridLink(userId: string, blockId: string, mediaId: string) {
    const block = await this.instagramBlockModel.findFirst({
      where: { id: blockId, userId },
    });
    if (!block) throw new NotFoundException('البلوك غير موجود');

    await this.instagramGridLinkModel.deleteMany({
      where: { blockId, mediaId },
    });
    return { success: true };
  }

  /** Fetch media for public display (by profile userId, uses first connection's token) */
  async getPublicMedia(userId: string, limit = 12) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!conn) return null;

    if (conn.tokenExpiry && new Date(conn.tokenExpiry) < new Date()) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        fields:
          'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
        limit: String(limit),
        access_token: conn.accessToken,
      });

      const res = await fetch(
        `${IG_GRAPH_BASE}/${conn.igUserId}/media?${params.toString()}`,
      );

      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  /**
   * Public embed payload for a rich Instagram social link (no token leaked).
   */
  async getPublicEmbedForLink(linkId: string) {
    const link = await this.prisma.socialLink.findUnique({
      where: { id: linkId },
      include: {
        profile: {
          select: { userId: true, visibility: true, username: true },
        },
      },
    });

    if (!link || link.status !== 'active') {
      throw new NotFoundException('الرابط غير موجود');
    }

    if (link.platform !== 'instagram') {
      throw new BadRequestException('هذا الرابط ليس لإنستغرام');
    }

    if (
      link.layout !== 'profile_card' &&
      link.layout !== 'media_grid'
    ) {
      throw new BadRequestException('هذا الرابط ليس بطاقة إنستغرام');
    }

    if (!link.connectionId) {
      throw new BadRequestException('لا يوجد حساب إنستغرام مرتبط بهذا الرابط');
    }

    const conn = await this.instagramConnectionModel.findFirst({
      where: {
        id: link.connectionId,
        userId: link.profile.userId,
      },
    });

    if (!conn) {
      throw new NotFoundException('انقطع ربط إنستغرام. أعد الربط من لوحة التحكم.');
    }

    if (conn.tokenExpiry && new Date(conn.tokenExpiry) < new Date()) {
      throw new BadRequestException({
        message: 'انتهت صلاحية توكن إنستغرام',
        tokenExpired: true,
      });
    }

    const profile = {
      username: conn.username,
      name: conn.name,
      profilePicUrl: conn.profilePicUrl,
      biography: conn.biography ?? null,
      website: conn.website ?? null,
      followersCount: conn.followersCount,
      followsCount: conn.followsCount ?? null,
      mediaCount: conn.mediaCount,
      profileUrl: `https://www.instagram.com/${conn.username}/`,
    };

    let media: Array<{
      id: string;
      mediaType: string;
      mediaUrl: string | null;
      thumbnailUrl: string | null;
      permalink: string | null;
      caption: string | null;
    }> = [];

    if (link.layout === 'media_grid') {
      try {
        const params = new URLSearchParams({
          fields:
            'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
          limit: '9',
          access_token: conn.accessToken,
        });
        const res = await fetch(
          `${IG_GRAPH_BASE}/${conn.igUserId}/media?${params.toString()}`,
        );
        if (res.ok) {
          const json = (await res.json()) as {
            data?: Array<{
              id: string;
              caption?: string;
              media_type?: string;
              media_url?: string;
              thumbnail_url?: string;
              permalink?: string;
            }>;
          };
          media = (json.data ?? []).slice(0, 9).map((item) => ({
            id: item.id,
            mediaType: item.media_type ?? 'IMAGE',
            mediaUrl: item.media_url ?? null,
            thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
            permalink: item.permalink ?? null,
            caption: item.caption ?? null,
          }));
        }
      } catch {
        media = [];
      }
    }

    return {
      linkId: link.id,
      layout: link.layout as 'profile_card' | 'media_grid',
      profile,
      media,
      coverUrl: media[0]?.thumbnailUrl ?? media[0]?.mediaUrl ?? null,
    };
  }

  /**
   * Attach an Instagram connection to an existing SocialLink (e.g. classic → card/grid).
   */
  async applyConnectionToLink(
    userId: string,
    linkId: string,
    connectionId: string,
    layout: 'profile_card' | 'media_grid',
  ) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) {
      throw new NotFoundException('لا يوجد حساب Instagram مرتبط');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const link = await this.prisma.socialLink.findFirst({
      where: { id: linkId, profileId: profile.id, platform: 'instagram' },
    });
    if (!link) {
      return this.createLinkFromConnection(userId, connectionId, layout);
    }

    const username = conn.username;
    const url = `https://www.instagram.com/${username}/`;
    const title =
      layout === 'profile_card'
        ? conn.name || `@${username}`
        : link.title || `منشورات @${username}`;

    const updated = await this.prisma.socialLink.update({
      where: { id: link.id },
      data: {
        connectionId,
        layout,
        username,
        url,
        title,
      },
    });

    if (profile.username) {
      await this.cacheManager.invalidate(`profile:username:${profile.username}`);
      await this.cacheManager.invalidate(`profile:username:v2:${profile.username}`);
    }

    return updated;
  }

  /**
   * Create a SocialLink after OAuth for profile_card / media_grid.
   */
  async createLinkFromConnection(
    userId: string,
    connectionId: string,
    layout: 'profile_card' | 'media_grid',
  ) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) {
      throw new NotFoundException('لا يوجد حساب Instagram مرتبط');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const existing = await this.prisma.socialLink.findFirst({
      where: {
        profileId: profile.id,
        platform: 'instagram',
        connectionId,
        layout,
        status: 'active',
      },
    });
    if (existing) {
      return existing;
    }

    const maxOrder = await this.prisma.socialLink.findFirst({
      where: { profileId: profile.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });

    const username = conn.username;
    const url = `https://www.instagram.com/${username}/`;
    const title =
      layout === 'profile_card'
        ? conn.name || `@${username}`
        : `منشورات @${username}`;

    let id = generateSocialLinkId();
    for (let attempt = 0; attempt < 8; attempt++) {
      const exists = await this.prisma.socialLink.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) break;
      id = generateSocialLinkId();
    }

    return this.prisma.socialLink.create({
      data: {
        id,
        profileId: profile.id,
        platform: 'instagram',
        username,
        url,
        title,
        layout,
        connectionId,
        displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
        status: 'active',
      },
    }).then(async (link) => {
      if (profile.username) {
        await this.cacheManager.invalidate(`profile:username:${profile.username}`);
        await this.cacheManager.invalidate(`profile:username:v2:${profile.username}`);
      }
      return link;
    });
  }

  /**
   * Connect Instagram manually using an existing access token.
   */
  async connectWithToken(accessToken: string, userId: string) {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new BadRequestException('Access Token مطلوب');
    }

    const profileParams = new URLSearchParams({
      fields: IG_ME_PROFILE_FIELDS,
      access_token: accessToken,
    });

    const profileRes = await fetch(
      `${IG_GRAPH_BASE}/me?${profileParams.toString()}`,
    );

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      throw new BadRequestException(
        `Access Token غير صالح أو منتهي الصلاحية: ${errText}`,
      );
    }

    const profile = (await profileRes.json()) as {
      id?: string;
      user_id?: string;
      username?: string;
      name?: string;
      profile_picture_url?: string;
      followers_count?: number;
      media_count?: number;
    };

    const igUserId = profile.id || profile.user_id;
    if (!igUserId) {
      throw new BadRequestException(
        'لم يتم العثور على معرف المستخدم في الاستجابة',
      );
    }

    let longToken = accessToken;
    let expiresIn = 60 * 60 * 24 * 60; // default 60 days

    if (this.appSecret) {
      try {
        const longParams = new URLSearchParams({
          grant_type: 'ig_exchange_token',
          client_secret: this.appSecret,
          access_token: accessToken,
        });

        const longRes = await fetch(
          `${IG_LONG_LIVED_URL}?${longParams.toString()}`,
        );
        if (longRes.ok) {
          const longData = (await longRes.json()) as {
            access_token: string;
            expires_in: number;
          };
          longToken = longData.access_token;
          expiresIn = longData.expires_in;
        }
      } catch {
        // If exchange fails, use the original token
      }
    }

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    const connection = await this.instagramConnectionModel.upsert({
      where: {
        userId_igUserId: { userId, igUserId: String(igUserId) },
      },
      create: {
        userId,
        accessToken: longToken,
        tokenExpiry,
        igUserId: String(igUserId),
        username: profile.username ?? '',
        name: profile.name ?? null,
        profilePicUrl: profile.profile_picture_url ?? null,
        followersCount: profile.followers_count ?? null,
        mediaCount: profile.media_count ?? null,
      },
      update: {
        accessToken: longToken,
        tokenExpiry,
        username: profile.username ?? '',
        name: profile.name ?? null,
        profilePicUrl: profile.profile_picture_url ?? null,
        followersCount: profile.followers_count ?? null,
        mediaCount: profile.media_count ?? null,
      },
    });

    void this.enableInboxWebhookSubscriptions(longToken);

    return { success: true, username: profile.username, connectionId: connection.id };
  }

  private async enableInboxWebhookSubscriptions(accessToken: string): Promise<void> {
    const result = await enableInstagramWebhookSubscriptions(accessToken);
    if (!result.ok) {
      console.warn(
        `[Instagram] subscribed_apps failed: ${result.error ?? 'unknown error'}`,
      );
    }
  }

  // ─── Insights & Comments ───────────────────────────────────

  /** Fetch Insights */
  async getInsights(userId: string, connectionId: string, metric: string = 'impressions,reach,profile_views') {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    if (conn.tokenExpiry && new Date(conn.tokenExpiry) < new Date()) {
      throw new BadRequestException('انتهت صلاحية توكن إنستغرام.');
    }

    const params = new URLSearchParams({
      metric,
      period: 'day',
      access_token: conn.accessToken,
    });

    const res = await fetch(`${IG_GRAPH_BASE}/${conn.igUserId}/insights?${params.toString()}`);
    if (!res.ok) {
      // Ignore errors for now and return empty state if account is not a Business account or lacking data
      return { data: [] };
    }
    return res.json();
  }

  /** Fetch Comments from Database */
  async getComments(userId: string, connectionId: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    return this.instagramCommentModel.findMany({
      where: { connectionId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  /** Sync Historical Comments from Meta API */
  async syncComments(userId: string, connectionId: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    // 1. Get recent media with their comments
    const mediaRes = await fetch(
      `${IG_GRAPH_BASE}/${conn.igUserId}/media?fields=id,comments{id,text,timestamp,from}&limit=10&access_token=${conn.accessToken}`
    );
    if (!mediaRes.ok) {
      const err = await mediaRes.text();
      console.error('[SyncComments] Failed to fetch media:', err);
      return { success: false };
    }

    const mediaData = await mediaRes.json();
    if (!mediaData.data) {
      console.error('[SyncComments] No media data returned:', mediaData);
      return { success: false };
    }
    
    console.log(`[SyncComments] Fetched ${mediaData.data.length} media items for sync.`);

    // 2. Save comments to database
    for (const media of mediaData.data) {
      if (media.comments && media.comments.data) {
        for (const comment of media.comments.data) {
          if (!comment.id || !comment.text || !comment.from) continue;
          
          await this.instagramCommentModel.upsert({
            where: { igCommentId: comment.id },
            create: {
              connectionId: conn.id,
              mediaId: media.id,
              igCommentId: comment.id,
              fromUsername: comment.from.username || 'unknown',
              fromIgId: comment.from.id || '',
              text: comment.text,
              timestamp: new Date(comment.timestamp),
            },
            update: { text: comment.text },
          });
        }
      }
    }

    return { success: true };
  }

  /** Reply to a specific comment via API */
  async replyToComment(userId: string, connectionId: string, commentId: string, message: string) {
    const conn = await this.instagramConnectionModel.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) throw new NotFoundException('لا يوجد حساب Instagram مرتبط');

    const comment = await this.instagramCommentModel.findFirst({
      where: { id: commentId, connectionId }
    });
    if (!comment) throw new NotFoundException('التعليق غير موجود');

    const params = new URLSearchParams({
      message,
      access_token: conn.accessToken,
    });

    const res = await fetch(`${IG_GRAPH_BASE}/${comment.igCommentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`فشل الرد على التعليق: ${err}`);
    }

    const data = await res.json();

    // Mark as replied in database
    await this.instagramCommentModel.update({
      where: { id: commentId },
      data: { isReplied: true }
    });

    return { success: true, igReplyId: data.id };
  }

  // ─── Webhooks / Deauthorize ─────────────────────────────────

  /** Handle incoming webhooks from Meta */
  async handleWebhookEvent(payload: any) {
    console.log('[Instagram Webhook] Received payload:', JSON.stringify(payload, null, 2));

    if (payload.object !== 'instagram' && payload.object !== 'page') {
      console.log(`[Instagram Webhook] Ignored object type: ${payload.object}`);
      return { success: true };
    }

    for (const entry of payload.entry || []) {
      // For instagram object, entry.id is the Instagram professional account ID.
      const igUserId = entry.id;

      // Business Login format: field/value directly on entry (not only entry.changes).
      if (
        entry.field === 'comments' ||
        entry.field === 'live_comments'
      ) {
        console.log(
          `[Instagram Webhook] Processing entry field: ${entry.field}`,
        );
        await this.processCommentWebhook(igUserId, entry.value);
      }

      for (const change of entry.changes || []) {
        console.log(`[Instagram Webhook] Processing change for field: ${change.field}`);

        if (change.field === 'comments' || change.field === 'live_comments') {
          await this.processCommentWebhook(igUserId, change.value);
        }
      }
    }

    await this.instagramInboxService.processWebhookPayload(payload);
    return { success: true };
  }

  private async processCommentWebhook(igUserId: string, value: any) {
    // Find the connection by igUserId
    const conn = await this.instagramConnectionModel.findFirst({
      where: { igUserId }
    });
    
    if (!conn) return; // We don't track this account

    // Extract comment details
    const { id: igCommentId, media, text, from, timestamp } = value;
    if (!igCommentId || !text || !from) return;

    // Save to database
    await this.instagramCommentModel.upsert({
      where: { igCommentId },
      create: {
        connectionId: conn.id,
        mediaId: media?.id || '',
        igCommentId,
        fromUsername: from.username || 'unknown',
        fromIgId: from.id || '',
        text,
        timestamp: new Date(timestamp * 1000), // convert unix seconds to Date
      },
      update: {
        text,
      }
    });
  }

  /** Instagram deauthorize callback (required by Facebook) */
  async handleDeauthorize(_body: { signed_request?: string }) {
    return { success: true };
  }

  /** Data deletion request callback (required by Facebook) */
  handleDataDeletion() {
    const frontendUrl =
      this.config.get<string>('APP_FRONTEND_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    return {
      url: `${frontendUrl}/privacy`,
      confirmation_code: `del_${Date.now()}`,
    };
  }
}
