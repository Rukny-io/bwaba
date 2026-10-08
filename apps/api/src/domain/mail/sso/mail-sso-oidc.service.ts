import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  MailAppMemberRole,
  MailAppStatus,
  MailMailboxStatus,
  type MailAppIdentityProvider,
  type MailIdentityProviderPreset,
} from '@prisma/client';
import { RedisService } from '../../../core/cache/redis.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { RedisOAuthCodeService } from '../../auth/redis-oauth-code.service';
import { MailAppAccessService } from '../mail-app-access.service';
import { MailMailboxSessionService } from '../mail-mailbox-session.service';
import { MailMembersService } from '../mail-members.service';
import { UpsertMailIdentityProviderDto } from './dto/mail-sso.dto';
import {
  OidcError,
  buildAuthorizationUrl,
  discoverOidc,
  exchangeAuthorizationCode,
  newOidcNonce,
  newPkce,
  normalizeIssuer,
  trustedEmailFromClaims,
  verifyIdToken,
} from './mail-oidc.client';
import { decryptMailSsoSecret, encryptMailSsoSecret } from './mail-sso-secret.util';

const STATE_TTL_SECONDS = 10 * 60;
const STATE_KEY = (state: string) => `mail:sso:oidc:state:${state}`;
const GOOGLE_ISSUER = 'https://accounts.google.com';

type OidcState = {
  identityProviderId: string;
  nonce: string;
  codeVerifier: string;
  loginHint: string | null;
};

export type MailIdentityProviderView = {
  id: string;
  preset: MailIdentityProviderPreset;
  enabled: boolean;
  issuer: string;
  clientId: string;
  hasClientSecret: boolean;
  emailDomain: string;
  jitProvisioning: boolean;
  defaultRole: MailAppMemberRole;
  enforceSso: boolean;
  autoMapMailboxByLocalPart: boolean;
  lastTestedAt: string | null;
  lastTestError: string | null;
};

/** Error codes surfaced to the mail login page as `?sso_error=`. */
export type MailSsoLoginErrorCode =
  | 'state'
  | 'provider'
  | 'email'
  | 'domain'
  | 'not_provisioned'
  | 'seat_limit'
  | 'disabled'
  | 'unknown';

@Injectable()
export class MailSsoOidcService {
  private readonly logger = new Logger(MailSsoOidcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly access: MailAppAccessService,
    private readonly members: MailMembersService,
    private readonly mailboxSessions: MailMailboxSessionService,
    private readonly auth: AuthService,
    private readonly oauthCodes: RedisOAuthCodeService,
  ) {}

  redirectUri(): string {
    return (
      this.config.get<string>('MAIL_SSO_OIDC_CALLBACK_URL') ||
      `${(this.config.get<string>('API_PUBLIC_URL') || 'https://api.rukny.io').replace(/\/$/, '')}/api/v1/mail/sso/oidc/callback`
    );
  }

  private mailBase(): string {
    return (
      this.config.get<string>('NEXT_PUBLIC_MAIL_URL') ||
      this.config.get<string>('MAIL_APP_URL') ||
      'https://mail.rukny.io'
    ).replace(/\/$/, '');
  }

  loginErrorRedirect(code: MailSsoLoginErrorCode, email?: string | null): string {
    const url = new URL(`${this.mailBase()}/login`);
    url.searchParams.set('sso_error', code);
    if (email) url.searchParams.set('email', email);
    return url.toString();
  }

  private toView(row: MailAppIdentityProvider): MailIdentityProviderView {
    return {
      id: row.id,
      preset: row.preset,
      enabled: row.enabled,
      issuer: row.issuer,
      clientId: row.clientId,
      hasClientSecret: !!row.clientSecretEncrypted,
      emailDomain: row.emailDomain,
      jitProvisioning: row.jitProvisioning,
      defaultRole: row.defaultRole,
      enforceSso: row.enforceSso,
      autoMapMailboxByLocalPart: row.autoMapMailboxByLocalPart,
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
      lastTestError: row.lastTestError,
    };
  }

  private async requireManager(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_MANAGE_REQUIRED',
        message: 'Only the owner or an admin can manage SSO.',
      });
    }
    return access;
  }

  // ---------------------------------------------------------------------------
  // Admin configuration
  // ---------------------------------------------------------------------------

  async getIdentityProvider(userId: string, publicAppId: string) {
    const access = await this.requireManager(userId, publicAppId);
    const row = await this.prisma.mailAppIdentityProvider.findUnique({
      where: { mailAppId: access.app.id },
    });
    return { identityProvider: row ? this.toView(row) : null, redirectUri: this.redirectUri() };
  }

  async upsertIdentityProvider(
    userId: string,
    publicAppId: string,
    dto: UpsertMailIdentityProviderDto,
  ) {
    const access = await this.requireManager(userId, publicAppId);
    const domain = access.app.primaryDomain?.trim().toLowerCase();
    if (!domain || access.app.domainStatus !== 'ACTIVE') {
      throw new BadRequestException({
        statusCode: 400,
        code: 'MAIL_SSO_DOMAIN_REQUIRED',
        message: 'Verify your workspace domain before connecting an identity provider.',
      });
    }

    const issuer = normalizeIssuer(dto.issuer);
    if (dto.preset === 'GOOGLE_WORKSPACE' && issuer !== GOOGLE_ISSUER) {
      throw new BadRequestException(`Google Workspace uses the issuer ${GOOGLE_ISSUER}.`);
    }
    if (dto.preset === 'MICROSOFT_ENTRA' && !/^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0$/i.test(issuer)) {
      throw new BadRequestException(
        'Microsoft Entra needs the tenant-specific issuer: https://login.microsoftonline.com/<tenant-id>/v2.0',
      );
    }

    const existing = await this.prisma.mailAppIdentityProvider.findUnique({
      where: { mailAppId: access.app.id },
    });
    const secret = dto.clientSecret?.trim();
    if (!existing && !secret) {
      throw new BadRequestException('Client secret is required.');
    }

    const issuerChanged = !existing || existing.issuer !== issuer;
    let lastTestError: string | null | undefined;
    if (dto.enabled || (existing?.enabled && dto.enabled !== false && issuerChanged)) {
      try {
        await discoverOidc(issuer, { fresh: true });
        lastTestError = null;
      } catch (error) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'MAIL_SSO_DISCOVERY_FAILED',
          message: `Could not load the identity provider: ${(error as Error).message}`,
        });
      }
    }

    const data = {
      preset: dto.preset,
      issuer,
      clientId: dto.clientId.trim(),
      emailDomain: domain,
      ...(secret ? { clientSecretEncrypted: encryptMailSsoSecret(secret) } : {}),
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.jitProvisioning !== undefined ? { jitProvisioning: dto.jitProvisioning } : {}),
      ...(dto.defaultRole ? { defaultRole: dto.defaultRole as MailAppMemberRole } : {}),
      ...(dto.enforceSso !== undefined ? { enforceSso: dto.enforceSso } : {}),
      ...(dto.autoMapMailboxByLocalPart !== undefined
        ? { autoMapMailboxByLocalPart: dto.autoMapMailboxByLocalPart }
        : {}),
      ...(lastTestError === null ? { lastTestedAt: new Date(), lastTestError: null } : {}),
    };

    try {
      const row = existing
        ? await this.prisma.mailAppIdentityProvider.update({ where: { id: existing.id }, data })
        : await this.prisma.mailAppIdentityProvider.create({
            data: {
              ...data,
              mailAppId: access.app.id,
              clientSecretEncrypted: data.clientSecretEncrypted ?? '',
            },
          });
      if (row.enforceSso && (!existing?.enforceSso || !existing.enabled) && row.enabled) {
        await this.revokePasswordSessionsForDomain(access.app.id, domain);
      }
      return { identityProvider: this.toView(row), redirectUri: this.redirectUri() };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Another workspace already uses SSO for this domain.');
      }
      throw error;
    }
  }

  async testIdentityProvider(userId: string, publicAppId: string) {
    const access = await this.requireManager(userId, publicAppId);
    const row = await this.prisma.mailAppIdentityProvider.findUnique({
      where: { mailAppId: access.app.id },
    });
    if (!row) throw new NotFoundException('No identity provider configured.');

    let error: string | null = null;
    let endpoints: { authorization: string; token: string } | null = null;
    try {
      const doc = await discoverOidc(row.issuer, { fresh: true });
      endpoints = { authorization: doc.authorization_endpoint, token: doc.token_endpoint };
      if (!row.clientSecretEncrypted) error = 'Client secret is missing.';
      else decryptMailSsoSecret(row.clientSecretEncrypted);
    } catch (e) {
      error = e instanceof OidcError ? e.message : 'The stored client secret could not be read. Save it again.';
    }

    const updated = await this.prisma.mailAppIdentityProvider.update({
      where: { id: row.id },
      data: { lastTestedAt: new Date(), lastTestError: error },
    });
    return { ok: !error, error, endpoints, identityProvider: this.toView(updated) };
  }

  async deleteIdentityProvider(userId: string, publicAppId: string) {
    const access = await this.requireManager(userId, publicAppId);
    await this.prisma.mailAppIdentityProvider.deleteMany({ where: { mailAppId: access.app.id } });
    return { ok: true };
  }

  /** Enforcing SSO must cut off sessions that were opened with a mailbox password. */
  private async revokePasswordSessionsForDomain(mailAppId: string, domain: string) {
    const boxes = await this.prisma.mailMailbox.findMany({
      where: { mailAppId, domain },
      select: { id: true },
    });
    await Promise.all(boxes.map((box) => this.mailboxSessions.revokeMailbox(box.id)));
  }

  // ---------------------------------------------------------------------------
  // Public login flow
  // ---------------------------------------------------------------------------

  private async findProviderForEmail(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const domain = email.split('@')[1];
    if (!domain || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return this.prisma.mailAppIdentityProvider.findFirst({
      where: {
        emailDomain: domain,
        enabled: true,
        mailApp: { status: MailAppStatus.ACTIVE },
      },
    });
  }

  async discover(rawEmail: string) {
    const idp = await this.findProviderForEmail(rawEmail ?? '');
    return {
      sso: !!idp,
      preset: idp?.preset ?? null,
      enforced: !!idp?.enforceSso,
    };
  }

  async startUrl(rawEmail: string): Promise<string> {
    const idp = await this.findProviderForEmail(rawEmail ?? '');
    if (!idp) return this.loginErrorRedirect('disabled', rawEmail);

    try {
      const discovery = await discoverOidc(idp.issuer);
      const state = randomBytes(24).toString('base64url');
      const nonce = newOidcNonce();
      const pkce = newPkce();
      const loginHint = rawEmail.trim().toLowerCase();
      const payload: OidcState = {
        identityProviderId: idp.id,
        nonce,
        codeVerifier: pkce.verifier,
        loginHint,
      };
      await this.redis.set(STATE_KEY(state), payload, STATE_TTL_SECONDS);
      return buildAuthorizationUrl(discovery, {
        clientId: idp.clientId,
        redirectUri: this.redirectUri(),
        state,
        nonce,
        codeChallenge: pkce.challenge,
        loginHint,
        hostedDomain: idp.preset === 'GOOGLE_WORKSPACE' ? idp.emailDomain : undefined,
      });
    } catch (error) {
      this.logger.warn(`OIDC start failed for ${idp.emailDomain}: ${(error as Error).message}`);
      return this.loginErrorRedirect('provider', rawEmail);
    }
  }

  /** Returns the URL the browser should be redirected to. Never throws. */
  async handleCallback(params: {
    code?: string;
    state?: string;
    error?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<string> {
    if (!params.state) return this.loginErrorRedirect('state');
    const key = STATE_KEY(params.state);
    const state = await this.redis.get<OidcState>(key);
    await this.redis.del(key);
    if (!state) return this.loginErrorRedirect('state');
    if (params.error || !params.code) return this.loginErrorRedirect('provider', state.loginHint);

    try {
      return await this.completeLogin(state, params.code, params.userAgent, params.ipAddress);
    } catch (error) {
      const code = this.classifyError(error);
      if (code === 'unknown') {
        this.logger.error(`OIDC callback failed: ${(error as Error).message}`, (error as Error).stack);
      } else {
        this.logger.warn(`OIDC callback rejected (${code}): ${(error as Error).message}`);
      }
      return this.loginErrorRedirect(code, state.loginHint);
    }
  }

  private classifyError(error: unknown): MailSsoLoginErrorCode {
    if (error instanceof SsoLoginError) return error.code;
    if (error instanceof OidcError) return 'provider';
    if (error instanceof HttpException) {
      const body = error.getResponse() as { code?: string };
      if (body?.code === 'MAIL_SSO_NOT_PROVISIONED') return 'not_provisioned';
      if (body?.code === 'MAIL_TEAM_LIMIT' || body?.code === 'MAIL_TEAM_PLAN_REQUIRED') {
        return 'seat_limit';
      }
    }
    return 'unknown';
  }

  private async completeLogin(
    state: OidcState,
    code: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const idp = await this.prisma.mailAppIdentityProvider.findUnique({
      where: { id: state.identityProviderId },
      include: { mailApp: { select: { id: true, appId: true, status: true, userId: true } } },
    });
    if (!idp || !idp.enabled || idp.mailApp.status !== MailAppStatus.ACTIVE) {
      throw new SsoLoginError('disabled');
    }

    const discovery = await discoverOidc(idp.issuer);
    const redirectUri = this.redirectUri();
    const tokens = await exchangeAuthorizationCode(discovery, {
      code,
      clientId: idp.clientId,
      clientSecret: decryptMailSsoSecret(idp.clientSecretEncrypted),
      redirectUri,
      codeVerifier: state.codeVerifier,
    });
    const claims = await verifyIdToken(tokens.id_token, {
      discovery,
      issuer: idp.issuer,
      clientId: idp.clientId,
      nonce: state.nonce,
    });

    const email = trustedEmailFromClaims(claims);
    if (!email) throw new SsoLoginError('email');
    if (email.split('@')[1] !== idp.emailDomain) throw new SsoLoginError('domain');
    if (idp.preset === 'GOOGLE_WORKSPACE' && claims.hd?.toLowerCase() !== idp.emailDomain) {
      throw new SsoLoginError('domain');
    }

    const user = await this.resolveUser(idp, claims.sub, email, claims.name, claims.picture);

    const { slotIndex } = await this.members.joinViaIdentityProvider({
      mailAppId: idp.mailApp.id,
      userId: user.id,
      email,
      jitProvisioning: idp.jitProvisioning,
      defaultRole: idp.defaultRole,
    });
    await this.claimMailboxes(idp, user.id, email);

    const result = await this.auth.completeExternalLogin(user, 'SSO', userAgent, ipAddress);
    const handoff = await this.oauthCodes.generate(
      {
        userId: result.user.id,
        email: result.user.email,
        user: result.user,
        needsProfileCompletion: result.needsProfileCompletion,
        userAgent,
        ipAddress,
        requiresChallenge: result.requiresChallenge,
        challengeReasons: result.challengeReasons,
      },
      ipAddress,
    );

    const dest = new URL(`${this.mailBase()}/callback`);
    dest.searchParams.set('code', handoff);
    dest.searchParams.set('next', `/apps/${idp.mailApp.appId}/open?next=inbox`);
    this.logger.log(`SSO login for ${email} into ${idp.mailApp.appId} (slot ${slotIndex})`);
    return dest.toString();
  }

  private async resolveUser(
    idp: MailAppIdentityProvider & { mailApp: { id: string } },
    subject: string,
    email: string,
    name?: string,
    picture?: string,
  ) {
    const userSelect = {
      id: true,
      email: true,
      role: true,
      profileCompleted: true,
      profile: { select: { name: true, username: true, avatar: true } },
    } as const;

    const linked = await this.prisma.mailSsoIdentity.findUnique({
      where: { identityProviderId_subject: { identityProviderId: idp.id, subject } },
      include: { user: { select: userSelect } },
    });
    if (linked) {
      await this.prisma.mailSsoIdentity.update({
        where: { id: linked.id },
        data: { email, lastLoginAt: new Date() },
      });
      return linked.user;
    }

    let user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: userSelect,
    });
    if (!user) {
      const invited = await this.prisma.mailAppEmailInvite.count({
        where: {
          mailAppId: idp.mailApp.id,
          email: { equals: email, mode: 'insensitive' },
          status: 'PENDING',
        },
      });
      if (!idp.jitProvisioning && !invited) throw new SsoLoginError('not_provisioned');
      const created = await this.auth.createVerifiedExternalUser({
        email,
        name: name ?? null,
        avatar: picture ?? null,
      });
      user = {
        id: created.id,
        email: created.email,
        role: created.role,
        profileCompleted: created.profileCompleted,
        profile: created.profile
          ? {
              name: created.profile.name,
              username: created.profile.username,
              avatar: created.profile.avatar,
            }
          : null,
      };
    }

    await this.prisma.mailSsoIdentity.create({
      data: {
        identityProviderId: idp.id,
        subject,
        userId: user.id,
        email,
        lastLoginAt: new Date(),
      },
    });
    return user;
  }

  /** Assign mailboxes reserved for this email, and optionally the one matching its local part. */
  private async claimMailboxes(idp: MailAppIdentityProvider, userId: string, email: string) {
    const localPart = email.split('@')[0];
    const candidates = await this.prisma.mailMailbox.findMany({
      where: {
        mailAppId: idp.mailAppId,
        status: MailMailboxStatus.ACTIVE,
        OR: [
          { pendingAssigneeEmail: { equals: email, mode: 'insensitive' } },
          ...(idp.autoMapMailboxByLocalPart
            ? [{ localPart: { equals: localPart, mode: 'insensitive' as const }, domain: idp.emailDomain, assignedUserId: null }]
            : []),
        ],
      },
      select: { id: true },
    });
    if (!candidates.length) return;
    await this.prisma.mailMailbox.updateMany({
      where: { id: { in: candidates.map((box) => box.id) } },
      data: { assignedUserId: userId, pendingAssigneeEmail: null },
    });
    await this.prisma.mailSsoAccessLink.updateMany({
      where: {
        mailAppId: idp.mailAppId,
        email: { equals: email, mode: 'insensitive' },
        usedAt: null,
        revokedAt: null,
      },
      data: { usedAt: new Date(), usedByUserId: userId },
    });
  }
}

class SsoLoginError extends Error {
  constructor(readonly code: MailSsoLoginErrorCode) {
    super(code);
  }
}
