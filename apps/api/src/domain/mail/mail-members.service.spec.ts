import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvitationStatus, MailAppMemberRole } from '@prisma/client';
import { MailMembersService } from './mail-members.service';

describe('MailMembersService', () => {
  const ownerId = 'owner-1';
  const appPublicId = 'app_public';
  const appDbId = 'app-db-1';

  function buildAccess(overrides: Record<string, unknown> = {}) {
    return {
      app: {
        id: appDbId,
        appId: appPublicId,
        name: 'Acme Mail',
        primaryDomain: 'acme.test',
        status: 'ACTIVE',
        userId: ownerId,
        slotIndex: 0,
      },
      isOwner: true,
      ...overrides,
    };
  }

  function createService(prismaOverrides: Record<string, unknown> = {}) {
    const prisma: any = {
      mailAppMember: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { slotIndex: null } }),
      },
      mailAppEmailInvite: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      mailSubscription: {
        findUnique: jest.fn().mockResolvedValue({
          status: 'ACTIVE',
          plan: 'STANDARD',
        }),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      mailApp: {
        update: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { slotIndex: 0 } }),
      },
      mailMailbox: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn(async (fn: (tx: any) => Promise<unknown>) =>
        fn(prisma),
      ),
      ...prismaOverrides,
    };

    const access = {
      requireAccess: jest.fn().mockResolvedValue(buildAccess()),
      requireOwner: jest.fn().mockResolvedValue(buildAccess()),
      canManageTeam: jest.fn().mockReturnValue(true),
    };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const email = {
      sendMailTeamInvitation: jest.fn().mockResolvedValue(undefined),
      sendMailOwnershipTransferred: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'NEXT_PUBLIC_MAIL_URL') return 'https://mail.test';
        if (key === 'AUTH_FRONTEND_URL') return 'https://accounts.test';
        return undefined;
      }),
    };

    const service = new MailMembersService(
      prisma as any,
      access as any,
      notifications as any,
      email as any,
      config as any,
    );

    return { service, prisma, access, notifications, email };
  }

  it('invites an existing user with expiry and email', async () => {
    const { service, prisma, email, notifications } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: ownerId,
      email: 'owner@acme.test',
      profile: { name: 'Owner', username: 'owner' },
    });
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-2',
      email: 'teammate@acme.test',
      profile: { name: 'Teammate' },
    });
    prisma.mailAppMember.findUnique.mockResolvedValue(null);
    prisma.mailAppMember.create.mockResolvedValue({
      id: 'mem-1',
      role: MailAppMemberRole.MEMBER,
      status: InvitationStatus.PENDING,
      invitedAt: new Date(),
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      slotIndex: null,
      user: {
        id: 'user-2',
        email: 'teammate@acme.test',
        profile: { name: 'Teammate', username: null, avatar: null },
      },
      inviter: {
        id: ownerId,
        email: 'owner@acme.test',
        profile: { name: 'Owner', username: 'owner' },
      },
      mailApp: {
        id: appDbId,
        appId: appPublicId,
        name: 'Acme Mail',
        primaryDomain: 'acme.test',
        status: 'ACTIVE',
        userId: ownerId,
      },
    });

    const result = await service.invite(ownerId, appPublicId, {
      email: 'teammate@acme.test',
      role: 'MEMBER' as any,
    });

    expect(result.kind).toBe('member');
    expect(result.needsSignup).toBe(false);
    expect(prisma.mailAppMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
          status: InvitationStatus.PENDING,
        }),
      }),
    );
    expect(email.sendMailTeamInvitation).toHaveBeenCalledWith(
      'teammate@acme.test',
      expect.objectContaining({
        inviteUrl: 'https://mail.test/apps',
        needsSignup: false,
      }),
    );
    expect(notifications.create).toHaveBeenCalled();
  });

  it('creates an email-only invite when the address has no Rukny user', async () => {
    const { service, prisma, email } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: ownerId,
      email: 'owner@acme.test',
      profile: { name: 'Owner', username: 'owner' },
    });
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.mailAppEmailInvite.findUnique.mockResolvedValue(null);
    prisma.mailAppEmailInvite.create.mockResolvedValue({
      id: 'ei-1',
      email: 'new@example.com',
      role: MailAppMemberRole.ADMIN,
      status: InvitationStatus.PENDING,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: 'tok_abc',
      inviter: {
        id: ownerId,
        email: 'owner@acme.test',
        profile: { name: 'Owner', username: 'owner' },
      },
    });

    const result = await service.invite(ownerId, appPublicId, {
      email: 'new@example.com',
      role: 'ADMIN' as any,
    });

    expect(result.kind).toBe('email_invite');
    expect(result.needsSignup).toBe(true);
    expect(prisma.mailAppEmailInvite.create).toHaveBeenCalled();
    expect(email.sendMailTeamInvitation).toHaveBeenCalledWith(
      'new@example.com',
      expect.objectContaining({
        needsSignup: true,
        inviteUrl: expect.stringMatching(/accounts\.test\/login\?next=.*invite/),
      }),
    );
  });

  it('rejects resend within the cooldown window', async () => {
    const { service, prisma } = createService();
    prisma.mailAppMember.findFirst.mockResolvedValue({
      id: 'mem-1',
      status: InvitationStatus.PENDING,
      lastResendAt: new Date(),
      role: MailAppMemberRole.MEMBER,
      userId: 'user-2',
      inviter: {
        email: 'owner@acme.test',
        profile: { name: 'Owner', username: null },
      },
      user: { email: 'teammate@acme.test', profile: null },
    });

    await expect(
      service.resend(ownerId, appPublicId, 'mem-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects claim when signed-in email does not match invite', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-9',
      email: 'other@example.com',
    });
    prisma.mailAppEmailInvite.findUnique.mockResolvedValue({
      id: 'ei-1',
      email: 'invited@example.com',
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 60_000),
      mailAppId: appDbId,
      mailApp: {
        id: appDbId,
        appId: appPublicId,
        name: 'Acme Mail',
        status: 'ACTIVE',
        userId: ownerId,
        slotIndex: 0,
      },
    });

    await expect(service.claimEmailInvite('user-9', 'tok')).rejects.toMatchObject(
      {
        response: expect.objectContaining({ code: 'MAIL_INVITE_EMAIL_MISMATCH' }),
      },
    );
  });

  it('transfers ownership to an accepted member', async () => {
    const { service, prisma, email, notifications } = createService();
    prisma.mailAppMember.findFirst.mockResolvedValue({
      id: 'mem-2',
      userId: 'user-2',
      status: InvitationStatus.ACCEPTED,
      user: {
        id: 'user-2',
        email: 'admin@acme.test',
        profile: { name: 'Admin', username: null, avatar: null },
      },
    });
    prisma.user.findUnique.mockResolvedValue({
      id: ownerId,
      email: 'owner@acme.test',
      profile: { name: 'Owner', username: 'owner' },
    });
    prisma.mailAppMember.findUnique.mockResolvedValue(null);
    prisma.mailAppMember.create.mockResolvedValue({});
    prisma.mailAppMember.update.mockResolvedValue({});
    prisma.mailApp.update.mockResolvedValue({});

    const result = await service.transferOwnership(ownerId, appPublicId, {
      memberId: 'mem-2',
    });

    expect(result.ok).toBe(true);
    expect(result.workspace.ownerUserId).toBe('user-2');
    expect(prisma.mailApp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-2' }),
      }),
    );
    expect(prisma.mailAppMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: ownerId,
          role: MailAppMemberRole.ADMIN,
          status: InvitationStatus.ACCEPTED,
        }),
      }),
    );
    expect(email.sendMailOwnershipTransferred).toHaveBeenCalledTimes(2);
    expect(notifications.create).toHaveBeenCalled();
  });

  it('blocks invite when console seat limit is reached', async () => {
    const { service, prisma } = createService();
    prisma.mailSubscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      plan: 'STANDARD',
    });
    prisma.mailAppMember.count.mockResolvedValue(5);
    prisma.mailAppEmailInvite.count.mockResolvedValue(0);

    await expect(
      service.invite(ownerId, appPublicId, {
        email: 'extra@acme.test',
        role: 'MEMBER' as any,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
