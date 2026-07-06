'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { AlertDialog, Button } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  IdentityDocumentSlot,
  UserIdentityRequest,
  UserRuknyVerifiedApplication,
  UserVerificationResponse,
} from '@/lib/types/verification';
import {
  formatDocumentType,
  formatUserDateTime,
  formatVerificationLevel,
  verificationLevelBadgeClass,
  verificationStatusBadgeClass,
} from '@/lib/users-format';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const DOCUMENT_SLOTS: { slot: IdentityDocumentSlot; label: string }[] = [
  { slot: 'primary_front', label: 'ID front' },
  { slot: 'primary_back', label: 'ID back' },
  { slot: 'residence_front', label: 'Residence front' },
  { slot: 'residence_back', label: 'Residence back' },
  { slot: 'selfie', label: 'Selfie' },
];

const RUKNY_CATEGORY_OPTIONS = [
  { value: 'business', label: 'Business / Company' },
  { value: 'personal', label: 'Personal' },
  { value: 'creator', label: 'Creator' },
] as const;

type RuknyCategory = (typeof RUKNY_CATEGORY_OPTIONS)[number]['value'];

interface UserVerificationPanelProps {
  userId: string;
  onUserUpdated?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
        verificationStatusBadgeClass(status),
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function IdentityRequestCard({
  request,
  actionLoading,
  onApprove,
  onReject,
  onViewDocument,
}: {
  request: UserIdentityRequest;
  actionLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDocument: (id: string, slot: IdentityDocumentSlot) => void;
}) {
  const availableSlots = DOCUMENT_SLOTS.filter(
    (item) => request.documents?.[item.slot],
  );

  return (
    <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {formatDocumentType(request.documentType)}
            </span>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Submitted {formatUserDateTime(request.submittedAt)}
          </p>
          {request.reviewedAt ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Reviewed {formatUserDateTime(request.reviewedAt)}
            </p>
          ) : null}
          {request.rejectionReason ? (
            <p className="text-xs text-[var(--danger)]">{request.rejectionReason}</p>
          ) : null}
          {request.documentsDeletedAt ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Documents deleted {formatUserDateTime(request.documentsDeletedAt)}
            </p>
          ) : null}
        </div>

        {request.status === 'pending' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-8 rounded-lg"
              isDisabled={actionLoading}
              onPress={() => onApprove(request.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              isDisabled={actionLoading}
              onPress={() => onReject(request.id)}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      {availableSlots.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)]/60 pt-3">
          {availableSlots.map((item) => (
            <Button
              key={item.slot}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg text-xs"
              isDisabled={actionLoading}
              onPress={() => onViewDocument(request.id, item.slot)}
            >
              <ExternalLink className="size-3.5" />
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RuknyApplicationCard({
  application,
  actionLoading,
  onApprove,
  onReject,
}: {
  application: UserRuknyVerifiedApplication;
  actionLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {application.displayName}
            </span>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-xs capitalize text-[var(--muted-foreground)]">
            {application.category}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
            {application.publicBio}
          </p>
          {application.rejectionReason ? (
            <p className="text-xs text-[var(--danger)]">{application.rejectionReason}</p>
          ) : null}
        </div>

        {application.status === 'pending' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-8 rounded-lg"
              isDisabled={actionLoading}
              onPress={() => onApprove(application.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              isDisabled={actionLoading}
              onPress={() => onReject(application.id)}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UserVerificationPanel({
  userId,
  onUserUpdated,
}: UserVerificationPanelProps) {
  const [data, setData] = useState<UserVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<
    { type: 'identity' | 'rukny'; id: string } | null
  >(null);
  const [rejectReason, setRejectReason] = useState('');
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [grantIdentityOpen, setGrantIdentityOpen] = useState(false);
  const [grantIdentityNote, setGrantIdentityNote] = useState('');
  const [ruknyCategory, setRuknyCategory] = useState<RuknyCategory>('business');
  const [ruknyDisplayName, setRuknyDisplayName] = useState('');
  const [ruknyPublicBio, setRuknyPublicBio] = useState('');
  const [ruknyGrantNote, setRuknyGrantNote] = useState('');
  const [revokeRuknyOpen, setRevokeRuknyOpen] = useState(false);
  const [revokeRuknyReason, setRevokeRuknyReason] = useState('');

  const loadVerification = useCallback(async () => {
    setLoading(true);
    try {
      const response = await hqApi.getUserVerification(userId);
      setData(response);
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not load verification data',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  async function handleApproveIdentity() {
    if (!approveId) return;
    setActionLoading(true);
    try {
      await hqApi.approveVerification(approveId);
      appToast.success('Verification request approved');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not approve request',
      );
    } finally {
      setActionLoading(false);
      setApproveId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      appToast.error('Please enter a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      if (rejectTarget.type === 'identity') {
        await hqApi.rejectVerification(rejectTarget.id, rejectReason.trim());
      } else {
        await hqApi.rejectRuknyVerified(rejectTarget.id, rejectReason.trim());
      }
      appToast.success('Request rejected');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not reject request',
      );
    } finally {
      setActionLoading(false);
      setRejectTarget(null);
      setRejectReason('');
    }
  }

  async function handleRevokeVerification() {
    setActionLoading(true);
    try {
      await hqApi.revokeUserVerification(userId, revokeReason.trim() || undefined);
      appToast.success('Identity verification revoked');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not revoke verification',
      );
    } finally {
      setActionLoading(false);
      setRevokeOpen(false);
      setRevokeReason('');
    }
  }

  async function handleViewDocument(requestId: string, slot: IdentityDocumentSlot) {
    setActionLoading(true);
    try {
      const response = await hqApi.getVerificationDocument(requestId, slot);
      window.open(response.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not open document',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveRukny(id: string) {
    setActionLoading(true);
    try {
      await hqApi.approveRuknyVerified(id);
      appToast.success('Rukny Verified application approved');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not approve application',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGrantIdentity() {
    setActionLoading(true);
    try {
      await hqApi.grantUserIdentityVerification(
        userId,
        grantIdentityNote.trim() || undefined,
      );
      appToast.success('Identity verification granted without review');
      setGrantIdentityOpen(false);
      setGrantIdentityNote('');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not grant identity verification',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGrantRuknyVerified() {
    if (!ruknyDisplayName.trim()) {
      appToast.error('Display name is required');
      return;
    }
    setActionLoading(true);
    try {
      await hqApi.grantUserRuknyVerified(userId, {
        category: ruknyCategory,
        displayName: ruknyDisplayName.trim(),
        publicBio: ruknyPublicBio.trim() || undefined,
        note: ruknyGrantNote.trim() || undefined,
      });
      appToast.success('Rukny Verified granted without review');
      setRuknyDisplayName('');
      setRuknyPublicBio('');
      setRuknyGrantNote('');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not grant Rukny Verified',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeRuknyVerified() {
    setActionLoading(true);
    try {
      await hqApi.revokeUserRuknyVerified(
        userId,
        revokeRuknyReason.trim() || undefined,
      );
      appToast.success('Rukny Verified revoked');
      setRevokeRuknyOpen(false);
      setRevokeRuknyReason('');
      await loadVerification();
      onUserUpdated?.();
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not revoke Rukny Verified',
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const pendingIdentity = data.identityRequests.find((item) => item.status === 'pending');
  const canRevokeIdentity = data.user.verificationLevel >= 3;
  const canGrantIdentity = data.user.verificationLevel < 3;
  const canGrantRukny = !data.user.isRuknyVerified;
  const canRevokeRukny = data.user.isRuknyVerified;

  return (
    <>
      <div className="space-y-4">
        <section className={detailPanelClassName}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Verification status
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Review identity requests and manage account verification.
              </p>
            </div>
            {canRevokeIdentity ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-[var(--danger)]/40 text-[var(--danger)]"
                isDisabled={actionLoading}
                onPress={() => setRevokeOpen(true)}
              >
                Revoke ID verification
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                verificationLevelBadgeClass(data.user.verificationLevel),
              )}
            >
              {formatVerificationLevel(data.user.verificationLevel)}
            </span>
            {data.user.isRuknyVerified ? (
              <span className="inline-flex rounded-full bg-[var(--primary)]/15 px-2.5 py-1 text-[11px] font-medium text-[var(--primary)]">
                Rukny Verified
                {data.user.verifiedCategory
                  ? ` · ${data.user.verifiedCategory}`
                  : ''}
              </span>
            ) : null}
          </div>
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
            Manual activation (no review)
          </h2>
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            Grant verification directly for companies, partners, or special cases
            without waiting for document review.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl bg-[var(--surface-secondary)] p-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Identity verification (ID level)
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Marks the account as ID verified immediately. Any pending request
                  is auto-approved.
                </p>
              </div>
              {canGrantIdentity ? (
                <>
                  <textarea
                    value={grantIdentityNote}
                    onChange={(e) => setGrantIdentityNote(e.target.value)}
                    placeholder="Internal note (e.g. company onboarding)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
                  />
                  <Button
                    size="sm"
                    className="h-8 rounded-lg"
                    isDisabled={actionLoading}
                    onPress={() => setGrantIdentityOpen(true)}
                  >
                    Grant ID verification
                  </Button>
                </>
              ) : (
                <p className="text-xs text-[var(--muted-foreground)]">
                  User already has ID-level verification.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl bg-[var(--surface-secondary)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Rukny Verified badge
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    For businesses, creators, or trusted accounts without an
                    application review.
                  </p>
                </div>
                {canRevokeRukny ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-[var(--danger)]/40 text-[var(--danger)]"
                    isDisabled={actionLoading}
                    onPress={() => setRevokeRuknyOpen(true)}
                  >
                    Revoke badge
                  </Button>
                ) : null}
              </div>

              {canGrantRukny ? (
                <div className="space-y-2">
                  <FilterDropdown
                    label="Category"
                    value={ruknyCategory}
                    options={RUKNY_CATEGORY_OPTIONS}
                    onChange={(value) => setRuknyCategory(value as RuknyCategory)}
                    disabled={actionLoading}
                  />
                  <input
                    type="text"
                    value={ruknyDisplayName}
                    onChange={(e) => setRuknyDisplayName(e.target.value)}
                    placeholder="Display name (company or public name)"
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm"
                  />
                  <textarea
                    value={ruknyPublicBio}
                    onChange={(e) => setRuknyPublicBio(e.target.value)}
                    placeholder="Public bio (optional)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
                  />
                  <textarea
                    value={ruknyGrantNote}
                    onChange={(e) => setRuknyGrantNote(e.target.value)}
                    placeholder="Internal note (optional)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
                  />
                  <Button
                    size="sm"
                    className="h-8 rounded-lg"
                    isDisabled={actionLoading || !ruknyDisplayName.trim()}
                    onPress={() => void handleGrantRuknyVerified()}
                  >
                    Grant Rukny Verified
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted-foreground)]">
                  User already has the Rukny Verified badge
                  {data.user.verifiedDisplayName
                    ? `: ${data.user.verifiedDisplayName}`
                    : ''}
                  .
                </p>
              )}
            </div>
          </div>
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            Identity verification requests
          </h2>

          {!data.identityRequests.length ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No identity verification requests for this user.
            </p>
          ) : (
            <div className="space-y-3">
              {data.identityRequests.map((request) => (
                <IdentityRequestCard
                  key={request.id}
                  request={request}
                  actionLoading={actionLoading}
                  onApprove={setApproveId}
                  onReject={(id) => setRejectTarget({ type: 'identity', id })}
                  onViewDocument={handleViewDocument}
                />
              ))}
            </div>
          )}

          {pendingIdentity ? (
            <p className="mt-3 text-xs text-[var(--warning)]">
              A pending request is awaiting your review.
            </p>
          ) : null}
        </section>

        {data.ruknyApplications.length > 0 ? (
          <section className={detailPanelClassName}>
            <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
              Rukny Verified applications
            </h2>
            <div className="space-y-3">
              {data.ruknyApplications.map((application) => (
                <RuknyApplicationCard
                  key={application.id}
                  application={application}
                  actionLoading={actionLoading}
                  onApprove={handleApproveRukny}
                  onReject={(id) => setRejectTarget({ type: 'rukny', id })}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={approveId !== null}
        onOpenChange={(open) => {
          if (!open) setApproveId(null);
        }}
        title="Approve verification"
        description="The user will be marked as ID verified and this request will be approved."
        confirmLabel="Approve"
        isLoading={actionLoading}
        onConfirm={handleApproveIdentity}
      />

      <ConfirmDialog
        isOpen={grantIdentityOpen}
        onOpenChange={(open) => {
          setGrantIdentityOpen(open);
          if (!open) setGrantIdentityNote('');
        }}
        title="Grant ID verification"
        description="This activates ID-level verification without reviewing uploaded documents. Use for trusted companies or manual onboarding."
        confirmLabel="Grant verification"
        isLoading={actionLoading}
        onConfirm={handleGrantIdentity}
      />

      <ConfirmDialog
        isOpen={revokeRuknyOpen}
        onOpenChange={(open) => {
          setRevokeRuknyOpen(open);
          if (!open) setRevokeRuknyReason('');
        }}
        title="Revoke Rukny Verified"
        description="Removes the Rukny Verified badge from this account."
        confirmLabel="Revoke badge"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleRevokeRuknyVerified}
      />

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={rejectTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setRejectTarget(null);
              setRejectReason('');
            }
          }}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[420px]">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Reject request</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Provide a reason the user will see for this rejection.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
                />
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" isDisabled={actionLoading}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={actionLoading || !rejectReason.trim()}
                  onPress={() => void handleReject()}
                >
                  {actionLoading ? 'Rejecting…' : 'Reject'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <AlertDialog>
        <AlertDialog.Backdrop isOpen={revokeOpen} onOpenChange={setRevokeOpen}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[420px]">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Revoke identity verification</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  This removes ID verification from the account. The user can submit a
                  new request later.
                </p>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Optional internal note"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
                />
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" isDisabled={actionLoading}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={actionLoading}
                  onPress={() => void handleRevokeVerification()}
                >
                  {actionLoading ? 'Revoking…' : 'Revoke verification'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
