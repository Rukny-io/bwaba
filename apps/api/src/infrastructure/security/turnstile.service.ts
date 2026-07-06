import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string;
  private readonly siteKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('TURNSTILE_SECRET_KEY') || '';
    this.siteKey =
      this.configService.get<string>('TURNSTILE_SITE_KEY') || '';

    if (!this.secretKey) {
      this.logger.warn(
        'Turnstile secret key missing — verification will be skipped in development.',
      );
    }
  }

  getSiteKey(): string {
    return this.siteKey;
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  async verifyToken(
    token: string,
    remoteIp?: string,
  ): Promise<{
    success: boolean;
    hostname?: string;
    challengeTs?: string;
    errorCodes?: string[];
    error?: string;
  }> {
    if (!this.secretKey) {
      this.logger.warn('Turnstile verification skipped — not configured');
      return { success: true, error: 'Service not configured' };
    }

    if (!token?.trim()) {
      throw new BadRequestException({
        message: 'Turnstile token is required',
        code: 'TURNSTILE_TOKEN_MISSING',
      });
    }

    try {
      const body = new URLSearchParams({
        secret: this.secretKey,
        response: token,
      });
      if (remoteIp) body.set('remoteip', remoteIp);

      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        },
      );

      if (!response.ok) {
        this.logger.error(`Turnstile API HTTP error: ${response.status}`);
        throw new BadRequestException({
          message: 'Turnstile verification failed',
          code: 'TURNSTILE_API_ERROR',
        });
      }

      const data = (await response.json()) as TurnstileVerifyResponse;

      if (!data.success) {
        const errorCodes = data['error-codes'] ?? [];
        this.logger.warn(
          `Turnstile verification failed: ${errorCodes.join(', ') || 'unknown'}`,
        );
        return {
          success: false,
          errorCodes,
          error: errorCodes.join(', ') || 'Verification failed',
        };
      }

      this.logger.log(
        `Turnstile verified — hostname: ${data.hostname ?? 'unknown'}`,
      );

      return {
        success: true,
        hostname: data.hostname,
        challengeTs: data.challenge_ts,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error('Turnstile verification error:', error);
      throw new BadRequestException({
        message: 'Turnstile verification failed',
        code: 'TURNSTILE_VERIFICATION_ERROR',
      });
    }
  }
}
