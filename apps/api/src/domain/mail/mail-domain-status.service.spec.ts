import { MailDomainStatusService } from './mail-domain-status.service';

describe('MailDomainStatusService', () => {
  it('returns no setup when the app has no domain', async () => {
    const prisma: any = {
      mailApp: { findUniqueOrThrow: jest.fn().mockResolvedValue({ primaryDomain: null }) },
    };
    const access = { requireAccess: jest.fn().mockResolvedValue({}) };
    const ses = { getEmailIdentity: jest.fn() };
    const service = new MailDomainStatusService(prisma, ses as never, access as never);

    await expect(service.check('u1', 'app1')).resolves.toEqual({ setup: null });
    expect(ses.getEmailIdentity).not.toHaveBeenCalled();
  });

  it('reports pending status without mutating data on GET', async () => {
    const prisma: any = {
      mailApp: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          appId: 'app1',
          primaryDomain: 'example.com',
          domainOwnershipToken: 'token',
          domainOwnershipVerifiedAt: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const access = { requireAccess: jest.fn().mockResolvedValue({}) };
    const ses = {
      getEmailIdentity: jest.fn().mockResolvedValue({
        found: true,
        sending: false,
        dkim: 'PENDING',
        tokens: ['dkim-token'],
      }),
    };
    const service = new MailDomainStatusService(prisma, ses as never, access as never);

    const result = await service.check('u1', 'app1');
    expect(result).toMatchObject({ domain: 'example.com', verified: false });
    expect(prisma.mailApp.update).not.toHaveBeenCalled();
  });
});
