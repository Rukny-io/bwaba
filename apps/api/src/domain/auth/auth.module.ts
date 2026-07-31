import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { QuickSignController } from './quicksign.controller';
import { QuickSignService } from './quicksign.service';
import { PasswordController } from './password.controller';
import { PasswordService } from './password.service';
import { IpVerificationService } from './ip-verification.service';
import { WebSocketTokenService } from './websocket-token.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { PendingTwoFactorService } from './pending-two-factor.service';
import { AccountLockoutService } from './account-lockout.service';
import { AccountLockoutController } from './account-lockout.controller';
import { AccountLinkingService } from './account-linking.service';
import { AccountLinkingController } from './account-linking.controller';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityUploadService } from './identity-upload.service';
import { TwoFactorRequiredGuard } from '../../core/common/guards/auth/two-factor-required.guard';
import { IdentityVerificationController } from './identity-verification.controller';
import { RuknyVerifiedService } from './rukny-verified.service';
import { RuknyVerifiedController } from './rukny-verified.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { isGitHubOAuthConfigured } from './oauth-providers.config';
import { parseDurationToSeconds } from './auth-duration.util';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { EmailModule } from '../../integrations/email/email.module';
import { RedisOAuthCodeService } from './redis-oauth-code.service';
import { OAuthStateService } from './oauth-state.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { RedisModule } from '../../core/cache/redis.module';
import { StoresModule } from '../stores/stores.module';
import { WhatsappModule } from '../../integrations/whatsapp/whatsapp.module';

import { OAuthProviderController } from './oauth-provider/oauth-provider.controller';
import { OAuthProviderService } from './oauth-provider/oauth-provider.service';

const authModuleLogger = new Logger('AuthModule');
const githubOAuthProviders = [];

if (isGitHubOAuthConfigured()) {
  githubOAuthProviders.push(GitHubStrategy);
} else {
  authModuleLogger.warn(
    'GitHub OAuth strategy disabled — GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not configured',
  );
}

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    EmailModule,
    NotificationsModule,
    StorageModule,
    RedisModule,
    StoresModule,
    WhatsappModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Do not allow fallback secrets in production
        secret: configService.get<string>('JWT_SECRET') ?? undefined,
        signOptions: {
          // jsonwebtoken types require number | StringValue (not plain string)
          expiresIn: parseDurationToSeconds(
            configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
            30 * 60,
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    QuickSignController,
    PasswordController,
    TwoFactorController,
    AccountLockoutController,
    AccountLinkingController,
    IdentityVerificationController,
    RuknyVerifiedController,
    OAuthProviderController,
  ],
  providers: [
    AuthService,
    QuickSignService,
    PasswordService,
    IpVerificationService,
    WebSocketTokenService,
    TokenService,
    TwoFactorService,
    PendingTwoFactorService,
    AccountLockoutService,
    AccountLinkingService,
    IdentityVerificationService,
    IdentityUploadService,
    TwoFactorRequiredGuard,
    RuknyVerifiedService,
    JwtStrategy,
    GoogleStrategy,
    LinkedInStrategy,
    FacebookStrategy,
    ...githubOAuthProviders,
    RedisOAuthCodeService,
    OAuthStateService,
    OAuthProviderService,
  ],
  exports: [
    AuthService,
    QuickSignService,
    PasswordService,
    IpVerificationService,
    WebSocketTokenService,
    TokenService,
    TwoFactorService,
    PendingTwoFactorService,
    AccountLockoutService,
    AccountLinkingService,
    IdentityVerificationService,
    RuknyVerifiedService,
    OAuthProviderService,
  ],
})
export class AuthModule {}
