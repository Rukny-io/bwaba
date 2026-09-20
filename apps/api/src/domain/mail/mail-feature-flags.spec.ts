import { ServiceUnavailableException } from '@nestjs/common';
import { MailFeatureFlags } from './mail-feature-flags';

describe('MailFeatureFlags', () => {
  function flags(values: Record<string, string | undefined>) {
    return new MailFeatureFlags({
      get: jest.fn((key: string) => values[key]),
    } as never);
  }

  it('defaults staged features off in production', () => {
    const subject = flags({ NODE_ENV: 'production' });
    expect(subject.resolveBimi()).toBe(false);
    expect(subject.showBimiLogos()).toBe(false);
    expect(subject.ruknyVerification()).toBe(false);
    expect(subject.outboundBimi()).toBe(false);
    expect(subject.bodyEncryptionEnabled()).toBe(false);
  });

  it('defaults staged features on for local development and tests', () => {
    expect(flags({ NODE_ENV: 'development' }).resolveBimi()).toBe(true);
    expect(flags({ NODE_ENV: 'test' }).outboundBimi()).toBe(true);
    expect(flags({ NODE_ENV: 'development' }).bodyEncryptionEnabled()).toBe(
      false,
    );
  });

  it('enables body encryption only when explicitly configured', () => {
    const subject = flags({
      NODE_ENV: 'production',
      MAIL_BODY_ENCRYPTION_ENABLED: 'true',
    });
    expect(subject.bodyEncryptionEnabled()).toBe(true);
  });

  it('defaults dual-write off in production and on in development', () => {
    expect(flags({ NODE_ENV: 'production' }).bodyEncryptionDualWrite()).toBe(
      false,
    );
    expect(flags({ NODE_ENV: 'development' }).bodyEncryptionDualWrite()).toBe(
      true,
    );
  });

  it('honors explicit MAIL_BODY_ENCRYPTION_DUAL_WRITE', () => {
    expect(
      flags({
        NODE_ENV: 'production',
        MAIL_BODY_ENCRYPTION_DUAL_WRITE: 'true',
      }).bodyEncryptionDualWrite(),
    ).toBe(true);
    expect(
      flags({
        NODE_ENV: 'development',
        MAIL_BODY_ENCRYPTION_DUAL_WRITE: 'false',
      }).bodyEncryptionDualWrite(),
    ).toBe(false);
  });

  it('honors explicit rollout values and fails closed at guarded endpoints', () => {
    const subject = flags({
      NODE_ENV: 'development',
      MAIL_RUKNY_DOMAIN_VERIFICATION_ENABLED: 'false',
      MAIL_OUTBOUND_BIMI_ENABLED: '1',
    });
    expect(subject.outboundBimi()).toBe(true);
    expect(() => subject.requireRuknyVerification()).toThrow(
      ServiceUnavailableException,
    );
  });
});
