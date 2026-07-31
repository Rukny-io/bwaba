import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

interface GitHubUserJson {
  id?: number | string;
  login?: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

interface GitHubProfile {
  id: string;
  displayName?: string;
  username?: string;
  photos?: { value: string }[];
  emails?: Array<GitHubEmail | { value: string; verified?: boolean }>;
  _json?: GitHubUserJson;
}

/**
 * 🔒 GitHub OAuth Strategy
 *
 * passport-github2 fails with InternalOAuthError ("Failed to fetch user emails")
 * when its built-in /user/emails GET errors. We override userProfile and fetch
 * emails ourselves with proper GitHub API headers.
 */
@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const clientID = (
      configService.get<string>('GITHUB_CLIENT_ID') ||
      process.env.GITHUB_CLIENT_ID ||
      ''
    ).trim();
    const clientSecret = (
      configService.get<string>('GITHUB_CLIENT_SECRET') ||
      process.env.GITHUB_CLIENT_SECRET ||
      ''
    ).trim();
    const callbackURL = (
      configService.get<string>('GITHUB_CALLBACK_URL') ||
      process.env.GITHUB_CALLBACK_URL ||
      ''
    ).trim();

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'GitHub OAuth misconfigured: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL are required',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['read:user', 'user:email'],
      scopeSeparator: ',',
      userAgent: 'Rukny-Auth',
      customHeaders: {
        Accept: 'application/json',
        'User-Agent': 'Rukny-Auth',
      },
      // 🔒 F-02: state is managed by OAuthStateService (Redis single-use nonce).
      state: false,
    } as unknown as StrategyOptions);

    // Surface GitHub's real token-exchange error (passport only says
    // "Failed to obtain access token" when the body has error=... and no token).
    const oauth2 = (this as unknown as { _oauth2: {
      getOAuthAccessToken: (
        code: string,
        params: Record<string, string>,
        callback: (
          err: Error | null,
          accessToken?: string,
          refreshToken?: string,
          results?: Record<string, string>,
        ) => void,
      ) => void;
    } })._oauth2;
    const originalGetToken = oauth2.getOAuthAccessToken.bind(oauth2);
    oauth2.getOAuthAccessToken = (code, params, callback) => {
      originalGetToken(code, params, (err, accessToken, refreshToken, results) => {
        if (err) {
          return callback(err, accessToken, refreshToken, results);
        }
        if (!accessToken) {
          const githubError = results?.error;
          const description = results?.error_description || '';
          const message = githubError
            ? `GitHub token error: ${githubError}${description ? ` — ${description}` : ''}`
            : 'Failed to obtain access token';
          return callback(new Error(message));
        }
        return callback(null, accessToken, refreshToken, results);
      });
    };
  }

  /**
   * Replace passport-github2's fragile email fetch with a controlled one.
   */
  userProfile(
    accessToken: string,
    done: (error: Error | null, profile?: GitHubProfile) => void,
  ): void {
    void this.buildProfile(accessToken)
      .then((profile) => done(null, profile))
      .catch((error: Error) => done(error));
  }

  private async buildProfile(accessToken: string): Promise<GitHubProfile> {
    const json = await this.githubGet<GitHubUserJson>(
      'https://api.github.com/user',
      accessToken,
    );

    let emails: GitHubEmail[] = [];
    let emailsError: string | null = null;
    try {
      const fetched = await this.githubGet<GitHubEmail[]>(
        'https://api.github.com/user/emails',
        accessToken,
      );
      if (Array.isArray(fetched)) {
        emails = fetched
          .filter((entry) => Boolean(entry?.email))
          .map((entry) => ({
            email: entry.email,
            primary: Boolean(entry.primary),
            verified: entry.verified === true,
          }));
      }
    } catch (error) {
      emailsError = (error as Error).message;
      this.logger.warn(`GitHub /user/emails failed: ${emailsError}`);
    }

    if (
      emails.length === 0 &&
      typeof json.email === 'string' &&
      json.email.trim()
    ) {
      emails = [
        {
          email: json.email.trim(),
          primary: true,
          verified: true,
        },
      ];
    }

    // GitHub App without "Email addresses: Read-only" returns 403
    // "Resource not accessible by integration" — fail with an actionable message.
    if (emails.length === 0 && this.isIntegrationEmailPermissionError(emailsError)) {
      throw new UnauthorizedException(
        'تطبيق GitHub لا يملك صلاحية قراءة البريد. من إعدادات GitHub App → Permissions → Account permissions → Email addresses اختر Read-only، احفظ، ثم ألغِ تفويض التطبيق من GitHub وأعد تسجيل الدخول.',
      );
    }

    return {
      id: String(json.id),
      displayName: json.name || json.login,
      username: json.login,
      photos: json.avatar_url ? [{ value: json.avatar_url }] : [],
      emails,
      _json: json,
    };
  }

  private isIntegrationEmailPermissionError(message: string | null): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return (
      normalized.includes('resource not accessible by integration') ||
      (normalized.includes('403') && normalized.includes('emails'))
    );
  }

  private async githubGet<T>(url: string, accessToken: string): Promise<T> {
    const headersList: Record<string, string>[] = [
      {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Rukny-Auth',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Rukny-Auth',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    ];

    let lastError: Error | null = null;
    for (const headers of headersList) {
      const response = await fetch(url, { headers });
      if (response.ok) {
        return (await response.json()) as T;
      }
      const body = await response.text();
      lastError = new Error(
        `${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`,
      );
      // Only retry with the alternate auth scheme on auth failures.
      if (response.status !== 401 && response.status !== 403) {
        break;
      }
    }

    throw lastError ?? new Error(`GitHub request failed: ${url}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GitHubProfile,
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    try {
      const emails = this.normalizeEmails(profile);

      const primaryEmail =
        emails.find((entry) => entry.primary && entry.verified) ??
        emails.find((entry) => entry.verified) ??
        emails.find((entry) => entry.primary) ??
        emails[0];

      if (!primaryEmail?.email) {
        return done(
          new UnauthorizedException(
            'لا يوجد بريد إلكتروني مرتبط بحساب GitHub. اجعل بريدك عاماً أو امنح صلاحية user:email ثم أعد المحاولة.',
          ),
          undefined,
        );
      }

      if (primaryEmail.verified !== true) {
        return done(
          new UnauthorizedException(
            'البريد الإلكتروني غير مُتحقق منه في GitHub',
          ),
          undefined,
        );
      }

      const displayName =
        profile.displayName?.trim() ||
        profile.username ||
        profile._json?.login ||
        primaryEmail.email.split('@')[0];

      done(null, {
        githubId: String(profile.id),
        email: primaryEmail.email,
        emailVerified: true,
        name: displayName,
        avatar:
          profile.photos?.[0]?.value ?? profile._json?.avatar_url ?? null,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      done(error as Error, undefined);
    }
  }

  private normalizeEmails(profile: GitHubProfile): GitHubEmail[] {
    const raw = profile.emails ?? [];
    return raw
      .map((entry) => {
        if ('email' in entry && typeof entry.email === 'string') {
          return {
            email: entry.email,
            primary: Boolean('primary' in entry ? entry.primary : false),
            verified: entry.verified === true,
          };
        }
        if ('value' in entry && typeof entry.value === 'string') {
          return {
            email: entry.value,
            primary: true,
            verified: entry.verified === true,
          };
        }
        return null;
      })
      .filter((entry): entry is GitHubEmail => Boolean(entry?.email));
  }
}
