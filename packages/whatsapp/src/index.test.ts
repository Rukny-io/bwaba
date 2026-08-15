import { createHmac, timingSafeEqual } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildOtpComponents } from './template-components';
import {
  assertWebhookDeliveryNotReplayed,
  verifyWebhookSignature,
} from './webhooks';

describe('buildOtpComponents', () => {
  it('builds body parameters for the OTP code', () => {
    expect(buildOtpComponents('483920')).toEqual([
      {
        type: 'body',
        parameters: [{ type: 'text', text: '483920' }],
      },
    ]);
  });

  it('adds copy-code button parameters when requested', () => {
    expect(buildOtpComponents('483920', true)).toEqual([
      {
        type: 'body',
        parameters: [{ type: 'text', text: '483920' }],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: '483920' }],
      },
    ]);
  });
});

describe('verifyWebhookSignature', () => {
  it('validates a correct HMAC signature', () => {
    const secret = 'test_secret';
    const body = '{"event":"message.delivered"}';
    const signature =
      'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

    expect(
      verifyWebhookSignature({
        rawBody: body,
        signatureHeader: signature,
        secret,
      }),
    ).toBe(true);
  });

  it('rejects invalid signatures', () => {
    expect(
      verifyWebhookSignature({
        rawBody: '{}',
        signatureHeader: 'sha256=deadbeef',
        secret: 'test_secret',
      }),
    ).toBe(false);
  });

  it('rejects stale timestamps', () => {
    const secret = 'test_secret';
    const body = '{}';
    const signature =
      'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
    const stale = String(Math.floor(Date.now() / 1000) - 600);

    expect(
      verifyWebhookSignature({
        rawBody: body,
        signatureHeader: signature,
        secret,
        timestampHeader: stale,
      }),
    ).toBe(false);
  });
});

describe('assertWebhookDeliveryNotReplayed', () => {
  it('dedupes delivery ids', () => {
    const seen = new Set<string>();
    expect(assertWebhookDeliveryNotReplayed('evt_1', seen)).toBe(true);
    expect(assertWebhookDeliveryNotReplayed('evt_1', seen)).toBe(false);
  });
});
