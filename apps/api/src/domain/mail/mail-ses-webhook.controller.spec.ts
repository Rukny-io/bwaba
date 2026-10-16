import { UnauthorizedException } from '@nestjs/common';
import { MailSesWebhookController } from './mail-ses-webhook.controller';

const snsEnvelope = {
  Type: 'Notification',
  MessageId: '1',
  Timestamp: '2026-01-01T00:00:00.000Z',
  TopicArn: 'arn:aws:sns:eu-north-1:123:rukny-mail-inbound',
  SigningCertURL: 'https://sns.eu-north-1.amazonaws.com/SimpleNotificationService.pem',
  Signature: 'abc',
  SignatureVersion: '2',
  Message: '{}',
};

describe('MailSesWebhookController', () => {
  it('does not require the header token for signed SNS envelopes', async () => {
    const inbound = {
      assertWebhookToken: jest.fn(),
      handleSnsPayload: jest.fn().mockResolvedValue({ ok: true, handled: 'sns' }),
    };
    const controller = new MailSesWebhookController(inbound as any);

    await expect(
      controller.handle({ body: snsEnvelope }),
    ).resolves.toEqual({ ok: true, handled: 'sns' });
    expect(inbound.assertWebhookToken).not.toHaveBeenCalled();
    expect(inbound.handleSnsPayload).toHaveBeenCalledWith(snsEnvelope);
  });

  it('requires the header token for direct SES JSON', async () => {
    const inbound = {
      assertWebhookToken: jest.fn(() => {
        throw new UnauthorizedException('Invalid mail webhook token.');
      }),
      handleSnsPayload: jest.fn(),
    };
    const controller = new MailSesWebhookController(inbound as any);

    await expect(
      controller.handle({ body: { notificationType: 'Received' } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(inbound.handleSnsPayload).not.toHaveBeenCalled();
  });
});
