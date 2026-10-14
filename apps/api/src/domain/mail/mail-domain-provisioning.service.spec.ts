import { BadRequestException, ConflictException } from '@nestjs/common';
import { MailDomainProvisioningService } from './mail-domain-provisioning.service';

describe('MailDomainProvisioningService', () => {
  const prisma: any = {
    mailApp: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const ses = {
    createEmailIdentity: jest.fn(),
  };
  const access = { requireOwner: jest.fn() };
  const quota = { assertCanAttachDomain: jest.fn() };
  const entitlement = { assertCanAttachDomain: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('false') };
  const service = new MailDomainProvisioningService(
    prisma, ses as never, access as never, quota as never, entitlement as never, config as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects malformed domains before touching providers', async () => {
    await expect(service.provision('u1', 'app1', 'not a domain')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(access.requireOwner).not.toHaveBeenCalled();
    expect(ses.createEmailIdentity).not.toHaveBeenCalled();
  });

  it('rejects a domain owned by another active app', async () => {
    access.requireOwner.mockResolvedValue({ isOwner: true, app: { id: 'internal-app' } });
    prisma.mailApp.findFirst.mockResolvedValueOnce({ appId: 'other-app' });

    await expect(service.provision('u1', 'app1', 'example.com')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(ses.createEmailIdentity).not.toHaveBeenCalled();
  });

  it('creates SES identity and persists pending DNS state', async () => {
    access.requireOwner.mockResolvedValue({ isOwner: true, app: { id: 'internal-app' } });
    prisma.mailApp.findFirst.mockResolvedValueOnce(null);
    ses.createEmailIdentity.mockResolvedValue({
      sending: false,
      dkim: 'PENDING',
      tokens: ['token-1'],
    });
    prisma.mailApp.update.mockResolvedValue({
      appId: 'app1',
      primaryDomain: 'example.com',
      domainStatus: 'PENDING_DNS',
      domainCheckedAt: null,
    });

    await expect(service.provision('u1', 'app1', 'Example.com')).resolves.toMatchObject({
      ses: { tokens: ['token-1'] },
    });
    expect(ses.createEmailIdentity).toHaveBeenCalledWith('example.com');
    expect(quota.assertCanAttachDomain).toHaveBeenCalledWith('internal-app', 'u1', 'example.com');
    expect(prisma.mailApp.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ primaryDomain: 'example.com' }) }),
    );
  });
});
