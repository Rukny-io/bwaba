import { asSnsEnvelope, isSnsEnvelope } from './sns-signature.util';

describe('sns-signature.util', () => {
  it('detects SNS envelopes', () => {
    expect(
      isSnsEnvelope({
        Type: 'Notification',
        MessageId: '1',
        Timestamp: '2026-01-01T00:00:00.000Z',
        TopicArn: 'arn:aws:sns:eu-north-1:123:topic',
        SigningCertURL:
          'https://sns.eu-north-1.amazonaws.com/cert.pem',
        Signature: 'abc',
        SignatureVersion: '2',
      }),
    ).toBe(true);
    expect(isSnsEnvelope({ notificationType: 'Received' })).toBe(false);
  });

  it('requires SNS fields', () => {
    expect(() => asSnsEnvelope({ Type: 'Notification' })).toThrow(
      /missing required fields/i,
    );
  });
});
