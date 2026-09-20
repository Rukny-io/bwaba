import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const MAIL_FEATURE_ENV = {
  resolveBimi: 'MAIL_BIMI_RESOLUTION_ENABLED',
  showBimiLogos: 'MAIL_BIMI_LOGOS_ENABLED',
  ruknyVerification: 'MAIL_RUKNY_DOMAIN_VERIFICATION_ENABLED',
  outboundBimi: 'MAIL_OUTBOUND_BIMI_ENABLED',
  bodyEncryption: 'MAIL_BODY_ENCRYPTION_ENABLED',
  bodyEncryptionDualWrite: 'MAIL_BODY_ENCRYPTION_DUAL_WRITE',
} as const;

@Injectable()
export class MailFeatureFlags {
  constructor(private readonly config: ConfigService) {}

  resolveBimi(): boolean {
    return this.enabled(MAIL_FEATURE_ENV.resolveBimi);
  }

  showBimiLogos(): boolean {
    return this.enabled(MAIL_FEATURE_ENV.showBimiLogos);
  }

  ruknyVerification(): boolean {
    return this.enabled(MAIL_FEATURE_ENV.ruknyVerification);
  }

  outboundBimi(): boolean {
    return this.enabled(MAIL_FEATURE_ENV.outboundBimi);
  }

  /** Defaults OFF in all environments until explicitly enabled. */
  bodyEncryptionEnabled(): boolean {
    const configured = this.config
      .get<string>(MAIL_FEATURE_ENV.bodyEncryption)
      ?.trim()
      .toLowerCase();
    return configured === 'true' || configured === '1';
  }

  /**
   * When true, encrypted mail keeps plaintext columns (MIGRATING) for rollback soak.
   * Defaults OFF in production; ON in dev/test unless explicitly set.
   */
  bodyEncryptionDualWrite(): boolean {
    return this.enabled(MAIL_FEATURE_ENV.bodyEncryptionDualWrite);
  }

  requireRuknyVerification(): void {
    this.require(this.ruknyVerification(), 'Rukny domain verification');
  }

  requireOutboundBimi(): void {
    this.require(this.outboundBimi(), 'Outbound BIMI setup');
  }

  private enabled(key: string): boolean {
    const configured = this.config.get<string>(key)?.trim().toLowerCase();
    if (configured === 'true' || configured === '1') return true;
    if (configured === 'false' || configured === '0') return false;
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  private require(enabled: boolean, feature: string): void {
    if (!enabled) {
      throw new ServiceUnavailableException(`${feature} is not enabled.`);
    }
  }
}
