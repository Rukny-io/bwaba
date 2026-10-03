import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const prisma = {
    developerApiKey: { findFirst: jest.fn() },
    developerWhatsappAccount: { findMany: jest.fn() },
  };
  const metaApi = { uploadMedia: jest.fn() };
  const tokenEncryption = { decrypt: jest.fn() };

  const service = new MediaService(
    prisma as any,
    metaApi as any,
    tokenEncryption as any,
  );

  const file = {
    buffer: Buffer.from('fake-image'),
    mimetype: 'image/jpeg',
    size: 1024,
    originalname: 'photo.jpg',
  } as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.developerApiKey.findFirst.mockResolvedValue({
      developerAppId: 'app-1',
    });
    prisma.developerWhatsappAccount.findMany.mockResolvedValue([
      {
        id: 'acc-1',
        accessTokenEncrypted: 'enc',
        phoneNumbers: [{ id: 'pn-1', phoneNumberId: 'meta-phone-1' }],
      },
    ]);
    tokenEncryption.decrypt.mockReturnValue('token');
    metaApi.uploadMedia.mockResolvedValue({ id: 'media-123' });
  });

  it('uploads media for the default active phone number', async () => {
    const result = await service.uploadMedia('user-1', 'key-1', file);

    expect(metaApi.uploadMedia).toHaveBeenCalledWith(
      'meta-phone-1',
      'token',
      file.buffer,
      'image/jpeg',
      'photo.jpg',
    );
    expect(result).toEqual({
      id: 'media-123',
      mime_type: 'image/jpeg',
      phone_number_id: 'meta-phone-1',
    });
  });

  it('rejects unsupported mime types', async () => {
    await expect(
      service.uploadMedia('user-1', 'key-1', {
        ...file,
        mimetype: 'application/zip',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown phone numbers', async () => {
    await expect(
      service.uploadMedia('user-1', 'key-1', file, 'missing-phone'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
