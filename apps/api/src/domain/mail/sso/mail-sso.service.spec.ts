import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvitationStatus, MailAppMemberRole } from '@prisma/client';
import { MailSsoService } from './mail-sso.service';

jest.mock('../mail-mailboxes.service', () => ({
  MailMailboxesService: class {},
}));
import { hashMailSsoToken, newMailSsoToken } from './mail-sso-token.util';

describe('MailSsoService', () => {
  const ownerId = 'owner-1';
  const appPublicId = '1234567890123456';
  const appDbId = 'app-db-1';

  const app = {
    id: appDbId,
    appId: appPublicId,
    name: 'Acme Mail',
    primaryDomain: 'acme.test',
    domainStatus: 'ACTIVE',
    status: 'ACTIVE',
    userId: ownerId,
    slotIndex: 0,
  };

  function createService() {
    const prisma: any = {
      mailAppSsoSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      mailSsoAccessLink: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(async ({ data }: any) => ({
          id: 'link-1',
          lastSentAt: new Date(),
          createdAt: new Date(),
          usedAt: null,
          revokedAt: null,
          ...data,
        })),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      mailAppMember: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      mailAppEmailInvite: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      mailMailbox: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({
          id: ownerId,
          email: 'owner@acme.test',
          profile: { name: 'Owner', username: null },
        }),
      },
    };
    const access = {
      requireAccess: jest.fn().mockResolvedValue({
        app,
        isOwner: true,
        role: 'OWNER',
        member: null,
      }),
      canManageTeam: jest.fn().mockReturnValue(true),
    };
    const members = {
      invite: jest.fn(),
      acceptInvitation: jest.fn(),
      claimEmailInvite: jest.fn(),
      list: jest.fn(),
    };
    const mailboxes = { create: jest.fn() };
    const mailboxSessions = {
      create: jest.fn().mockResolvedValue('mbx-session-token'),
      revokeMailbox: jest.fn().mockResolvedValue(undefined),
    };
    const email = {
      sendMailSsoAccessLink: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest.fn((key: string) =>
        key === 'NEXT_PUBLIC_MAIL_URL' ? 'https://mail.test' : undefined,
      ),
    };

    const service = new MailSsoService(
      prisma,
      access as any,
      members as any,
      mailboxes as any,
      mailboxSessions as any,
      email as any,
      config as any,
    );
    return {
      service,
      prisma,
      access,
      members,
      mailboxes,
      mailboxSessions,
      email,
    };
  }

  function usableLink(overrides: Record<string, unknown> = {}) {
    return {
      id: 'link-1',
      mailAppId: appDbId,
      email: 'sara@acme.test',
      mailboxId: 'box-1',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      revokedAt: null,
      lastSentAt: new Date(),
      createdAt: new Date(),
      mailApp: app,
      mailbox: {
        id: 'box-1',
        localPart: 'sara',
        domain: 'acme.test',
        status: 'ACTIVE',
      },
      ...overrides,
    };
  }

  describe('provision', () => {
    it('invites a new email silently, reserves the mailbox and emails one link', async () => {
      const { service, prisma, members, email, mailboxSessions } =
        createService();
      members.invite.mockResolvedValue({
        kind: 'email_invite',
        emailInvite: { id: 'ei-1' },
        needsSignup: true,
      });
      prisma.mailMailbox.findFirst.mockResolvedValue({
        id: 'box-1',
        localPart: 'sara',
        domain: 'acme.test',
      });

      const result = await service.provision(ownerId, appPublicId, {
        email: ' Sara@Acme.test ',
        role: 'MEMBER' as any,
        mailboxId: 'box-1',
      });

      expect(members.invite).toHaveBeenCalledWith(
        ownerId,
        appPublicId,
        { email: 'sara@acme.test', role: 'MEMBER' },
        { sendEmail: false },
      );
      expect(prisma.mailMailbox.update).toHaveBeenCalledWith({
        where: { id: 'box-1' },
        data: { assignedUserId: null, pendingAssigneeEmail: 'sara@acme.test' },
      });
      expect(mailboxSessions.revokeMailbox).toHaveBeenCalledWith('box-1');
      // Previous live links for the same email are revoked before the new one is created.
      expect(prisma.mailSsoAccessLink.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: 'sara@acme.test',
            usedAt: null,
          }),
        }),
      );
      const created = prisma.mailSsoAccessLink.create.mock.calls[0][0].data;
      expect(created.emailInviteId).toBe('ei-1');
      expect(created.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(result.link.url).toMatch(
        /^https:\/\/mail\.test\/sso\/open\/[A-Za-z0-9_-]{43}$/,
      );
      expect(hashMailSsoToken(result.link.url.split('/').pop()!)).toBe(
        created.tokenHash,
      );
      expect(email.sendMailSsoAccessLink).toHaveBeenCalledWith(
        'sara@acme.test',
        expect.objectContaining({
          mailboxAddress: 'sara@acme.test',
          url: result.link.url,
        }),
      );
      expect(result.needsSignup).toBe(true);
    });

    it('assigns directly to an accepted member without re-inviting', async () => {
      const { service, prisma, members } = createService();
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-2',
        email: 'sara@acme.test',
      });
      prisma.mailAppMember.findUnique.mockResolvedValue({
        id: 'mem-2',
        status: InvitationStatus.ACCEPTED,
      });
      prisma.mailMailbox.findFirst.mockResolvedValue({
        id: 'box-1',
        localPart: 'sara',
        domain: 'acme.test',
      });

      const result = await service.provision(ownerId, appPublicId, {
        email: 'sara@acme.test',
        role: 'MEMBER' as any,
        mailboxId: 'box-1',
      });

      expect(members.invite).not.toHaveBeenCalled();
      expect(prisma.mailMailbox.update).toHaveBeenCalledWith({
        where: { id: 'box-1' },
        data: { assignedUserId: 'user-2', pendingAssigneeEmail: null },
      });
      expect(result.alreadyMember).toBe(true);
    });

    it('rejects emails outside the allowed domains', async () => {
      const { service, prisma } = createService();
      prisma.mailAppSsoSettings.findUnique.mockResolvedValue({
        quickLinkEnabled: true,
        autoAcceptOnLink: true,
        skipMailboxPasswordForAssigned: true,
        linkTtlHours: 72,
        allowedEmailDomains: ['acme.test'],
      });
      await expect(
        service.provision(ownerId, appPublicId, {
          email: 'x@gmail.com',
          role: 'MEMBER' as any,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('is blocked when quick links are disabled', async () => {
      const { service, prisma } = createService();
      prisma.mailAppSsoSettings.findUnique.mockResolvedValue({
        quickLinkEnabled: false,
        autoAcceptOnLink: true,
        skipMailboxPasswordForAssigned: true,
        linkTtlHours: 72,
        allowedEmailDomains: [],
      });
      await expect(
        service.provision(ownerId, appPublicId, {
          email: 'sara@acme.test',
          role: 'MEMBER' as any,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'MAIL_SSO_DISABLED' }),
      });
    });

    it('rejects non-managers', async () => {
      const { service, access } = createService();
      access.canManageTeam.mockReturnValue(false);
      await expect(
        service.provision('viewer', appPublicId, {
          email: 'sara@acme.test',
          role: 'MEMBER' as any,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('provisionBulk', () => {
    it('reports per-row results including the seat limit and duplicates', async () => {
      const { service, members } = createService();
      members.invite
        .mockResolvedValueOnce({
          kind: 'member',
          member: { id: 'mem-a' },
          needsSignup: false,
        })
        .mockRejectedValueOnce(
          new ForbiddenException({
            statusCode: 403,
            code: 'MAIL_TEAM_LIMIT',
            message: 'This plan allows 1 console members.',
          }),
        );

      const result = await service.provisionBulk(ownerId, appPublicId, {
        rows: [
          { email: 'a@acme.test', role: 'MEMBER' as any },
          { email: 'b@acme.test', role: 'MEMBER' as any },
          { email: 'A@acme.test', role: 'VIEWER' as any },
        ],
      });

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(2);
      expect(result.results[1]).toMatchObject({
        ok: false,
        code: 'MAIL_TEAM_LIMIT',
      });
      expect(result.results[2]).toMatchObject({
        ok: false,
        error: 'Duplicate row for this email.',
      });
    });
  });

  describe('consumeLink', () => {
    const token = newMailSsoToken();

    it('rejects malformed tokens without a DB lookup', async () => {
      const { service, prisma } = createService();
      await expect(
        service.consumeLink('user-2', 'nope', {}),
      ).rejects.toBeTruthy();
      expect(prisma.mailSsoAccessLink.findUnique).not.toHaveBeenCalled();
    });

    it('rejects expired links', async () => {
      const { service, prisma } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(
        usableLink({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(
        service.consumeLink('user-2', token, {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'MAIL_SSO_LINK_EXPIRED' }),
      });
    });

    it('rejects a signed-in user whose email does not match', async () => {
      const { service, prisma } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(usableLink());
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-9',
        email: 'other@acme.test',
      });
      await expect(
        service.consumeLink('user-9', token, {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'MAIL_SSO_EMAIL_MISMATCH' }),
      });
      expect(prisma.mailSsoAccessLink.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a stale link when its mailbox was reassigned', async () => {
      const { service, prisma } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(
        usableLink({
          mailbox: {
            id: 'box-1',
            localPart: 'sara',
            domain: 'acme.test',
            status: 'ACTIVE',
            assignedUserId: 'another-user',
          },
        }),
      );
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'sara@acme.test',
      });
      await expect(
        service.consumeLink('user-2', token, {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'MAIL_SSO_MAILBOX_REASSIGNED',
        }),
      });
      expect(prisma.mailSsoAccessLink.updateMany).not.toHaveBeenCalled();
    });

    it('rejects double use when the atomic claim loses the race', async () => {
      const { service, prisma } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(usableLink());
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'sara@acme.test',
      });
      prisma.mailSsoAccessLink.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.consumeLink('user-2', token, {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'MAIL_SSO_LINK_USED' }),
      });
    });

    it('claims the email invite, assigns reserved seats and opens the mailbox', async () => {
      const { service, prisma, members, mailboxSessions } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(usableLink());
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'Sara@acme.test',
      });
      prisma.mailAppEmailInvite.findFirst.mockResolvedValue({
        token: 'invite-tok',
      });
      members.claimEmailInvite.mockResolvedValue({
        workspace: { slotIndex: 3 },
      });
      prisma.mailMailbox.findFirst.mockResolvedValue({
        id: 'box-1',
        localPart: 'sara',
        domain: 'acme.test',
        status: 'ACTIVE',
        assignedUserId: 'user-2',
      });

      const result = await service.consumeLink('user-2', token, {});

      expect(members.claimEmailInvite).toHaveBeenCalledWith(
        'user-2',
        'invite-tok',
      );
      expect(prisma.mailMailbox.updateMany).toHaveBeenCalledWith({
        where: { mailAppId: appDbId, pendingAssigneeEmail: 'sara@acme.test' },
        data: { assignedUserId: 'user-2', pendingAssigneeEmail: null },
      });
      expect(mailboxSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-2',
          mailboxId: 'box-1',
          appId: appPublicId,
        }),
      );
      expect(result).toMatchObject({
        needsConfirmation: false,
        workspace: { appId: appPublicId, slotIndex: 3 },
        mailbox: { id: 'box-1', address: 'sara@acme.test' },
        mailboxSessionToken: 'mbx-session-token',
      });
    });

    it('accepts a pending member invitation', async () => {
      const { service, prisma, members } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(
        usableLink({ mailboxId: null, mailbox: null }),
      );
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'sara@acme.test',
      });
      prisma.mailAppMember.findUnique.mockResolvedValue({
        id: 'mem-2',
        status: InvitationStatus.PENDING,
        role: MailAppMemberRole.MEMBER,
        slotIndex: null,
      });
      members.acceptInvitation.mockResolvedValue({
        workspace: { slotIndex: 1 },
      });

      const result = await service.consumeLink('user-2', token, {});
      expect(members.acceptInvitation).toHaveBeenCalledWith('user-2', 'mem-2');
      expect(result).toMatchObject({ needsConfirmation: false, mailbox: null });
    });

    it('asks for confirmation when auto-accept is off', async () => {
      const { service, prisma } = createService();
      prisma.mailAppSsoSettings.findUnique.mockResolvedValue({
        quickLinkEnabled: true,
        autoAcceptOnLink: false,
        skipMailboxPasswordForAssigned: true,
        linkTtlHours: 72,
        allowedEmailDomains: [],
      });
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(usableLink());
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'sara@acme.test',
      });

      const result = await service.consumeLink('user-2', token, {});
      expect(result.needsConfirmation).toBe(true);
      expect(prisma.mailSsoAccessLink.updateMany).not.toHaveBeenCalled();
    });

    it('releases the link when joining fails', async () => {
      const { service, prisma } = createService();
      prisma.mailSsoAccessLink.findUnique.mockResolvedValue(usableLink());
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'sara@acme.test',
      });
      prisma.mailAppEmailInvite.findFirst.mockResolvedValue(null);

      await expect(
        service.consumeLink('user-2', token, {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'MAIL_SSO_INVITE_GONE' }),
      });
      expect(prisma.mailSsoAccessLink.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: { usedAt: null, usedByUserId: null },
      });
    });
  });
});
