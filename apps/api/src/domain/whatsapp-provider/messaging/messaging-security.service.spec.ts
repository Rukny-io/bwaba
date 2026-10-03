import { BadRequestException } from '@nestjs/common';
import { MessagingSecurityService } from './messaging-security.service';

describe('MessagingSecurityService', () => {
  const prisma = {
    developerWhatsappTemplate: { findFirst: jest.fn() },
  };
  const service = new MessagingSecurityService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeE164', () => {
    it('accepts valid E.164 numbers', () => {
      expect(service.normalizeE164('+9647812345678')).toBe('+9647812345678');
    });

    it('rejects invalid numbers', () => {
      expect(() => service.normalizeE164('07812345678')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('resolveApprovedTemplate', () => {
    it('returns null for non-template messages', async () => {
      await expect(
        service.resolveApprovedTemplate('app-1', 'user-1', {
          to: '+9647812345678',
          type: 'text',
          text: { body: 'hello' },
        }),
      ).resolves.toBeNull();
    });

    it('requires an approved template for template messages', async () => {
      prisma.developerWhatsappTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveApprovedTemplate('app-1', 'user-1', {
          to: '+9647812345678',
          type: 'template',
          template: { name: 'otp_verify', language: { code: 'ar' } },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
