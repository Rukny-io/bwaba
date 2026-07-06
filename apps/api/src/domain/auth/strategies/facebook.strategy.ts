import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

type FacebookStrategyOptions = StrategyOptions & {
  businessConfigId?: string;
};

/**
 * Facebook Login for Business uses `config_id` instead of `scope` in the OAuth dialog.
 * @see https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business
 */
class ConfigurableFacebookStrategy extends Strategy {
  private readonly businessConfigId?: string;

  constructor(
    options: FacebookStrategyOptions,
    verify: any,
  ) {
    const { businessConfigId, ...strategyOptions } = options;
    super(strategyOptions as any, verify);
    this.businessConfigId = businessConfigId;
  }

  authorizationParams(options: object) {
    const params = super.authorizationParams(options) as Record<string, string>;
    if (this.businessConfigId) {
      params.config_id = this.businessConfigId;
    }
    return params;
  }
}

/**
 * Facebook Login (Meta) — sign-in only, separate from Instagram API integration.
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(
  ConfigurableFacebookStrategy,
  'facebook',
) {
  constructor(private readonly configService: ConfigService) {
    const clientID =
      configService.get<string>('FACEBOOK_APP_ID') ||
      configService.get<string>('INSTAGRAM_APP_ID');
    const clientSecret =
      configService.get<string>('FACEBOOK_APP_SECRET') ||
      configService.get<string>('INSTAGRAM_APP_SECRET');
    const configId = configService.get<string>('FACEBOOK_CONFIG_ID')?.trim();

    if (!clientID || !/^\d+$/.test(clientID.trim())) {
      throw new Error(
        'FACEBOOK_APP_ID (or INSTAGRAM_APP_ID) must be a numeric Meta App ID from developers.facebook.com → App settings → Basic.',
      );
    }

    const strategyOptions: FacebookStrategyOptions = {
      clientID: clientID.trim(),
      clientSecret: clientSecret?.trim(),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      // passport-facebook defaults to v3.2 — deprecated; causes permission errors on Meta
      graphAPIVersion: 'v21.0',
      authorizationURL: 'https://www.facebook.com/v21.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v21.0/oauth/access_token',
      profileURL: 'https://graph.facebook.com/v21.0/me',
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      businessConfigId: configId,
    };

    // Business Login: permissions come from the Meta configuration, not scope.
    if (!configId) {
      strategyOptions.scope = ['email', 'public_profile'];
    }

    super(strategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(
        new UnauthorizedException(
          'لا يوجد بريد إلكتروني مرتبط بحساب Facebook. يرجى السماح بمشاركة البريد أو استخدام تسجيل الدخول بالبريد.',
        ),
        undefined,
      );
    }

    const displayName =
      profile.displayName ||
      [profile.name?.givenName, profile.name?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      email.split('@')[0];

    const user = {
      facebookId: profile.id,
      email,
      emailVerified: true,
      name: displayName,
      avatar: profile.photos?.[0]?.value ?? null,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
