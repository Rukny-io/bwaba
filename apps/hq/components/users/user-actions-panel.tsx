'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Key } from '@react-types/shared';
import { ChevronDown, LogOut, MoreHorizontal, Trash2, UserX, UserCheck } from 'lucide-react';
import {
  AlertDialog,
  Button,
  Dropdown,
  Label,
  Separator,
} from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminUserDetail, UserRole } from '@/lib/types/users';
import { ROLE_OPTIONS, formatRole } from '@/lib/users-format';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';

interface UserActionsPanelProps {
  user: AdminUserDetail;
  currentAdminId: string;
  onUserUpdated: () => void;
}

export function UserActionsPanel({
  user,
  currentAdminId,
  onUserUpdated,
}: UserActionsPanelProps) {
  const router = useRouter();
  const [roleDraft, setRoleDraft] = useState<UserRole>(user.role);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isSelf = user.id === currentAdminId;
  const roleOptions = ROLE_OPTIONS.filter((o) => o.value);

  useEffect(() => {
    setRoleDraft(user.role);
  }, [user.role]);

  async function applyRoleChange() {
    if (!pendingRole) return;
    setActionLoading(true);
    try {
      await hqApi.updateUserRole(user.id, pendingRole);
      appToast.success('User role updated');
      setRoleDraft(pendingRole);
      onUserUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not update role',
      );
      setRoleDraft(user.role);
    } finally {
      setActionLoading(false);
      setPendingRole(null);
    }
  }

  async function handleRevokeSessions() {
    setActionLoading(true);
    try {
      await hqApi.revokeUserSessions(user.id);
      appToast.success('All sessions revoked');
      onUserUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not revoke sessions',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeactivate() {
    setActionLoading(true);
    try {
      await hqApi.deactivateUser(user.id, deactivateReason.trim() || undefined);
      appToast.success('Account deactivated');
      setDeactivateReason('');
      onUserUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not deactivate account',
      );
    } finally {
      setActionLoading(false);
      setDeactivateOpen(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      await hqApi.reactivateUser(user.id);
      appToast.success('Account reactivated');
      onUserUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not reactivate account',
      );
    } finally {
      setActionLoading(false);
      setReactivateOpen(false);
    }
  }

  async function handleDeleteUser() {
    if (deleteEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      appToast.error('The entered email does not match the user email');
      return;
    }
    setActionLoading(true);
    try {
      await hqApi.deleteUser(user.id);
      appToast.success('User deleted');
      router.replace('/app/users');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not delete user',
      );
    } finally {
      setActionLoading(false);
      setDeleteOpen(false);
      setDeleteEmail('');
    }
  }

  function handleRoleChange(next: string) {
    const role = next as UserRole;
    setRoleDraft(role);
    if (role !== user.role) setPendingRole(role);
  }

  function handleMoreAction(key: Key) {
    const action = String(key);
    if (action === 'revoke') setRevokeOpen(true);
    if (action === 'deactivate') setDeactivateOpen(true);
    if (action === 'reactivate') setReactivateOpen(true);
    if (action === 'delete') setDeleteOpen(true);
  }

  return (
    <>
      <section className={detailPanelClassName}>
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          Account actions
        </h2>
        <p className="mb-5 text-xs text-[var(--muted-foreground)]">
          Manage role and sensitive operations for this account.
          {user.isDeactivated ? ' This account is currently deactivated.' : ''}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Role</p>
            <FilterDropdown
              label="Change role"
              value={roleDraft}
              options={roleOptions}
              onChange={handleRoleChange}
              disabled={isSelf || actionLoading}
            />
            {isSelf ? (
              <p className="text-[11px] text-[var(--warning)]">
                You cannot change your own role
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              More actions
            </p>
            <Dropdown>
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-xl border-[var(--border)] px-4"
                isDisabled={actionLoading}
              >
                <MoreHorizontal className="size-4" />
                Actions
                <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
              </Button>
              <Dropdown.Popover className="min-w-[14rem]">
                <Dropdown.Menu onAction={handleMoreAction}>
                  <Dropdown.Item
                    id="revoke"
                    textValue="Revoke sessions"
                    isDisabled={user.sessions.length === 0}
                  >
                    <LogOut className="size-4 text-[var(--muted-foreground)]" />
                    <Label>Revoke all sessions</Label>
                  </Dropdown.Item>
                  {user.isDeactivated ? (
                    <Dropdown.Item
                      id="reactivate"
                      textValue="Reactivate account"
                      isDisabled={isSelf}
                    >
                      <UserCheck className="size-4 text-[var(--success)]" />
                      <Label>Reactivate account</Label>
                    </Dropdown.Item>
                  ) : (
                    <Dropdown.Item
                      id="deactivate"
                      textValue="Deactivate account"
                      isDisabled={isSelf}
                    >
                      <UserX className="size-4 text-[var(--warning)]" />
                      <Label>Deactivate account</Label>
                    </Dropdown.Item>
                  )}
                  <Separator />
                  <Dropdown.Item
                    id="delete"
                    textValue="Delete user"
                    variant="danger"
                    isDisabled={isSelf}
                  >
                    <Trash2 className="size-4" />
                    <Label>Delete user</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={pendingRole !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRole(null);
            setRoleDraft(user.role);
          }
        }}
        title="Change user role"
        description={
          pendingRole
            ? `Change ${user.email}'s role to "${formatRole(pendingRole)}"?`
            : ''
        }
        confirmLabel="Change role"
        isLoading={actionLoading}
        onConfirm={applyRoleChange}
      />

      <ConfirmDialog
        isOpen={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke all sessions"
        description="The user will be signed out from all devices immediately."
        confirmLabel="Revoke sessions"
        isLoading={actionLoading}
        onConfirm={handleRevokeSessions}
      />

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={deactivateOpen}
          onOpenChange={(open) => {
            setDeactivateOpen(open);
            if (!open) setDeactivateReason('');
          }}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[420px]">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Deactivate account?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  The user will be signed out and unable to sign in until reactivated.
                </p>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Optional reason (logged in admin activity)…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
                />
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" isDisabled={actionLoading}>
                  Cancel
                </Button>
                <Button variant="danger" isDisabled={actionLoading} onPress={handleDeactivate}>
                  {actionLoading ? 'Deactivating…' : 'Deactivate'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <ConfirmDialog
        isOpen={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title="Reactivate account"
        description="Restore sign-in access for this user?"
        confirmLabel="Reactivate"
        isLoading={actionLoading}
        onConfirm={handleReactivate}
      />

      <AlertDialog>
        <AlertDialog.Backdrop isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[420px]">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete user permanently?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  This action cannot be undone. Type the user email to confirm:
                </p>
                <p className="text-sm font-medium" dir="ltr">
                  {user.email}
                </p>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm"
                  dir="ltr"
                />
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" isDisabled={actionLoading}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={
                    actionLoading ||
                    deleteEmail.trim().toLowerCase() !== user.email.toLowerCase()
                  }
                  onPress={handleDeleteUser}
                >
                  {actionLoading ? 'Deleting…' : 'Delete permanently'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
