import { MailAppMemberRole } from '@prisma/client';
import {
  MailAppAccessService,
  type MailAppAccess,
} from './mail-app-access.service';

function access(
  partial: Partial<MailAppAccess> & Pick<MailAppAccess, 'role' | 'isOwner'>,
): MailAppAccess {
  return {
    app: { id: 'app-uuid' } as MailAppAccess['app'],
    member: null,
    ...partial,
  };
}

describe('MailAppAccessService permissions (phase A)', () => {
  const service = new MailAppAccessService({} as never);

  it('allows only owner and admin to manage mailboxes', () => {
    expect(
      service.canManageMailboxes(access({ isOwner: true, role: 'OWNER' })),
    ).toBe(true);
    expect(
      service.canManageMailboxes(
        access({ isOwner: false, role: MailAppMemberRole.ADMIN }),
      ),
    ).toBe(true);
    expect(
      service.canManageMailboxes(
        access({ isOwner: false, role: MailAppMemberRole.MEMBER }),
      ),
    ).toBe(false);
    expect(
      service.canManageMailboxes(
        access({ isOwner: false, role: MailAppMemberRole.BILLING }),
      ),
    ).toBe(false);
  });

  it('lets assignees operate their own mailbox without manage rights', () => {
    const member = access({
      isOwner: false,
      role: MailAppMemberRole.MEMBER,
    });
    expect(
      service.canOperateMailbox('user-1', member, {
        assignedUserId: 'user-1',
      }),
    ).toBe(true);
    expect(
      service.canOperateMailbox('user-1', member, {
        assignedUserId: 'someone-else',
      }),
    ).toBe(false);
  });

  it('keeps billing for owner, admin, and billing role only', () => {
    expect(
      service.canManageBilling(access({ isOwner: true, role: 'OWNER' })),
    ).toBe(true);
    expect(
      service.canManageBilling(
        access({ isOwner: false, role: MailAppMemberRole.ADMIN }),
      ),
    ).toBe(true);
    expect(
      service.canManageBilling(
        access({ isOwner: false, role: MailAppMemberRole.BILLING }),
      ),
    ).toBe(true);
    expect(
      service.canManageBilling(
        access({ isOwner: false, role: MailAppMemberRole.MEMBER }),
      ),
    ).toBe(false);
  });
});
