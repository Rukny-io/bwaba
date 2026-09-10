import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { MailDomainVerificationController } from './mail-domain-verification.controller';
import { MailPublicController } from './mail-public.controller';

jest.mock('./mail-domain-verification.service', () => ({
  MailDomainVerificationService: class MailDomainVerificationService {},
}));

describe('Mail BIMI controllers', () => {
  it('protects customer BIMI routes with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      MailDomainVerificationController,
    );
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard]));
  });

  it('decodes an SVG upload and delegates it for the authenticated owner', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
    );
    const bimi = {
      uploadCustomerLogo: jest.fn().mockResolvedValue({ ready: false }),
    };
    const controller = new MailDomainVerificationController(
      {} as never,
      bimi as never,
    );

    await expect(
      controller.uploadBimiLogo({ id: 'user-1' } as never, '1234567890123456', {
        contentBase64: svg.toString('base64'),
        fileName: 'brand.svg',
        mimeType: 'image/svg+xml',
      }),
    ).resolves.toEqual({ ready: false });

    expect(bimi.uploadCustomerLogo).toHaveBeenCalledWith(
      'user-1',
      '1234567890123456',
      expect.objectContaining({
        buffer: svg,
        size: svg.length,
        mimetype: 'image/svg+xml',
        originalname: 'brand.svg',
      }),
    );
  });

  it('delegates BIMI logo deletion for the authenticated owner', async () => {
    const bimi = {
      deleteCustomerLogo: jest.fn().mockResolvedValue({ logoUploaded: false }),
    };
    const controller = new MailDomainVerificationController(
      {} as never,
      bimi as never,
    );

    await expect(
      controller.deleteBimiLogo({ id: 'user-1' } as never, '1234567890123456'),
    ).resolves.toEqual({ logoUploaded: false });
    expect(bimi.deleteCustomerLogo).toHaveBeenCalledWith(
      'user-1',
      '1234567890123456',
    );
  });

  it('delegates BIMI authority upload and deletion for the authenticated owner', async () => {
    const pem = Buffer.from(
      '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n',
    );
    const bimi = {
      uploadCustomerAuthority: jest
        .fn()
        .mockResolvedValue({ certificateUploaded: true }),
      deleteCustomerAuthority: jest
        .fn()
        .mockResolvedValue({ certificateUploaded: false }),
    };
    const controller = new MailDomainVerificationController(
      {} as never,
      bimi as never,
    );

    await expect(
      controller.uploadBimiAuthority(
        { id: 'user-1' } as never,
        '1234567890123456',
        {
          contentBase64: pem.toString('base64'),
          fileName: 'authority.pem',
          mimeType: 'application/pem-certificate-chain',
        },
      ),
    ).resolves.toEqual({ certificateUploaded: true });
    expect(bimi.uploadCustomerAuthority).toHaveBeenCalledWith(
      'user-1',
      '1234567890123456',
      expect.objectContaining({
        buffer: pem,
        originalname: 'authority.pem',
      }),
    );

    await expect(
      controller.deleteBimiAuthority(
        { id: 'user-1' } as never,
        '1234567890123456',
      ),
    ).resolves.toEqual({ certificateUploaded: false });
    expect(bimi.deleteCustomerAuthority).toHaveBeenCalledWith(
      'user-1',
      '1234567890123456',
    );
  });

  it('serves the public SVG with a safe content type and cache policy', async () => {
    const logo = Buffer.from('<svg/>');
    const response = {
      set: jest.fn(),
      send: jest.fn().mockReturnValue(undefined),
    } as unknown as Response;
    const bimi = {
      publicCustomerLogo: jest.fn().mockResolvedValue(logo),
    };
    const controller = new MailPublicController({} as never, bimi as never);

    await controller.bimiLogo('1234567890123456', 'svg', response);

    expect(bimi.publicCustomerLogo).toHaveBeenCalledWith(
      '1234567890123456',
      'svg',
    );
    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      }),
    );
    expect(response.send).toHaveBeenCalledWith(logo);
  });

  it('serves the public authority PEM with a safe content type', async () => {
    const pem = Buffer.from(
      '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n',
    );
    const response = {
      set: jest.fn(),
      send: jest.fn().mockReturnValue(undefined),
    } as unknown as Response;
    const bimi = {
      publicCustomerAuthority: jest.fn().mockResolvedValue(pem),
    };
    const controller = new MailPublicController({} as never, bimi as never);

    await controller.bimiAuthority('1234567890123456', response);

    expect(bimi.publicCustomerAuthority).toHaveBeenCalledWith(
      '1234567890123456',
    );
    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pem-certificate-chain',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      }),
    );
    expect(response.send).toHaveBeenCalledWith(pem);
  });

  it('returns not found when a public BIMI logo does not exist', async () => {
    const controller = new MailPublicController(
      {} as never,
      {
        publicCustomerLogo: jest.fn().mockResolvedValue(null),
      } as never,
    );

    await expect(
      controller.bimiLogo('1234567890123456', 'svg', {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response),
    ).rejects.toThrow('BIMI logo not found.');
  });
});
