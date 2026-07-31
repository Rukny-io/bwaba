'use client';

import type { Key } from '@react-types/shared';
import { useRouter } from 'next/navigation';
import { LogOut, MoreHorizontal } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminUser } from '@/lib/types/users';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';

interface UsersRowActionsProps {
  user: AdminUser;
  onRefresh: () => void;
}

export function UsersRowActions({ user, onRefresh }: UsersRowActionsProps) {
  const router = useRouter();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRevokeSessions() {
    setLoading(true);
    try {
      await hqApi.revokeUserSessions(user.id);
      appToast.success('Sessions revoked');
      onRefresh();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not revoke sessions',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAction(key: Key) {
    const action = String(key);
    if (action === 'view') router.push(`/app/users/${user.id}`);
    if (action === 'security') router.push(`/app/users/${user.id}?tab=security`);
    if (action === 'revoke') setRevokeOpen(true);
  }

  return (
    <>
      <Dropdown>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Quick actions"
          className="rounded-lg"
        >
          <MoreHorizontal className="size-4" />
        </Button>
        <Dropdown.Popover className="min-w-[12rem]">
          <Dropdown.Menu onAction={handleAction}>
            <Dropdown.Item id="view" textValue="View details">
              <Label>View details</Label>
            </Dropdown.Item>
            <Dropdown.Item id="security" textValue="Open security">
              <Label>Security tab</Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="revoke"
              textValue="Revoke sessions"
              isDisabled={user.sessionsCount === 0}
            >
              <LogOut className="size-4 text-[var(--muted-foreground)]" />
              <Label>Revoke sessions</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <ConfirmDialog
        isOpen={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke all sessions"
        description={`Sign ${user.email} out from all devices?`}
        confirmLabel="Revoke sessions"
        isLoading={loading}
        onConfirm={handleRevokeSessions}
      />
    </>
  );
}
