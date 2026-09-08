import {
  MailAuthenticationVerdict,
  MailBrandCertificateType,
  MailMessageDirection,
  MailMessageFolder,
  MailMessageStatus,
  MailSenderBrandStatus,
} from '@prisma/client';
import { MailMessagesService } from './mail-messages.service';

describe('MailMessagesService sender identity view', () => {
  const flags = {
    resolveBimi: jest.fn().mockReturnValue(true),
    showBimiLogos: jest.fn().mockReturnValue(true),
    ruknyVerification: jest.fn().mockReturnValue(true),
  };
  const service = new MailMessagesService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    flags as never,
  );
  const row = {
    id: 'message-1',
    mailboxId: 'mailbox-1',
    threadId: 'thread-1',
    messageId: '<message@example.com>',
    inReplyTo: null,
    direction: MailMessageDirection.INBOUND,
    folder: MailMessageFolder.INBOX,
    status: MailMessageStatus.RECEIVED,
    fromAddress: 'sender@example.com',
    fromName: 'Sender',
    senderDomain: 'example.com',
    spfVerdict: MailAuthenticationVerdict.PASS,
    dkimVerdict: MailAuthenticationVerdict.PASS,
    dmarcVerdict: MailAuthenticationVerdict.PASS,
    toAddresses: ['inbox@rukny.test'],
    ccAddresses: [],
    bccAddresses: [],
    subject: 'Hello',
    bodyText: 'Body',
    bodyHtml: null,
    snippet: 'Body',
    isRead: false,
    isStarred: false,
    sesMessageId: 'ses-1',
    errorMessage: null,
    sentAt: null,
    receivedAt: new Date('2026-09-08T12:00:00Z'),
    createdAt: new Date('2026-09-08T12:00:00Z'),
    updatedAt: new Date('2026-09-08T12:00:00Z'),
  };
  const identity = {
    domain: 'example.com',
    logoS3Key: 'logos/mail-senders/example.com/hash.webp',
    brandStatus: MailSenderBrandStatus.READY,
    certificateType: MailBrandCertificateType.VMC,
    certificateValidTo: new Date('2099-01-01T00:00:00Z'),
    ruknyVerified: false,
  };

  beforeEach(() => {
    flags.resolveBimi.mockReturnValue(true);
    flags.showBimiLogos.mockReturnValue(true);
    flags.ruknyVerification.mockReturnValue(true);
  });

  it('exposes a cached VMC logo only for a DMARC-passing message', () => {
    const view = (service as any).toView(row, identity);
    expect(view.fromAvatarUrl).toBe(
      '/api/media/logos/mail-senders/example.com/hash.webp',
    );
    expect(view.verificationType).toBe('BIMI_VMC');
    expect(view.authentication).toEqual({
      spf: MailAuthenticationVerdict.PASS,
      dkim: MailAuthenticationVerdict.PASS,
      dmarc: MailAuthenticationVerdict.PASS,
    });
  });

  it('does not expose a logo or badge when DMARC failed', () => {
    const view = (service as any).toView(
      { ...row, dmarcVerdict: MailAuthenticationVerdict.FAIL },
      identity,
    );
    expect(view.fromAvatarUrl).toBeNull();
    expect(view.verificationType).toBeNull();
    expect(view.senderBrand.logoUrl).toBeNull();
  });

  it('prefers a current VMC badge when both trust sources qualify', () => {
    const view = (service as any).toView(row, {
      ...identity,
      ruknyVerified: true,
    });
    expect(view.verificationType).toBe('BIMI_VMC');
  });

  it('falls back to Rukny trust without exposing a non-ready BIMI logo', () => {
    const view = (service as any).toView(row, {
      ...identity,
      brandStatus: MailSenderBrandStatus.INVALID,
      certificateType: MailBrandCertificateType.NONE,
      ruknyVerified: true,
    });
    expect(view.fromAvatarUrl).toBeNull();
    expect(view.verificationType).toBe('RUKNY');
  });

  it('redacts BIMI logos while the display rollout flag is disabled', () => {
    flags.showBimiLogos.mockReturnValue(false);
    const view = (service as any).toView(row, identity);
    expect(view.fromAvatarUrl).toBeNull();
    expect(view.senderBrand.logoUrl).toBeNull();
    expect(view.verificationType).toBeNull();
  });

  it('does not expose cached BIMI identity while resolution/read is disabled', () => {
    flags.resolveBimi.mockReturnValue(false);
    const view = (service as any).toView(row, identity);
    expect(view.fromAvatarUrl).toBeNull();
    expect(view.verificationType).toBeNull();
  });

  it('does not emit a Rukny badge while verification rollout is disabled', () => {
    flags.ruknyVerification.mockReturnValue(false);
    const view = (service as any).toView(row, {
      ...identity,
      certificateType: MailBrandCertificateType.NONE,
      ruknyVerified: true,
    });
    expect(view.verificationType).toBeNull();
  });
});
