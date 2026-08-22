'use client';

import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminMailAppDetail } from '@/lib/types/mail';
import {
  formatMailDateTime,
  formatMailDomainStatus,
  mailDomainStatusChipColor,
} from '@/lib/mail-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

export function MailAppDomainPanel({
  app,
  onRefreshed,
}: {
  app: AdminMailAppDetail;
  onRefreshed: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleRefresh() {
    setBusy(true);
    try {
      const result = await hqApi.refreshMailAppDomain(app.appId);
      if (result.refreshed) {
        appToast.success('Domain status refreshed from SES');
      } else if (!result.sesAvailable) {
        appToast.info('AWS keys are not configured on the API — showing the last known status');
      } else {
        appToast.info('No change');
      }
      await onRefreshed();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not refresh domain',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={detailPanelClassName}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Domain</h2>
        <Button
          size="sm"
          variant="tertiary"
          className="rounded-lg"
          isDisabled={busy || !app.primaryDomain}
          onPress={() => void handleRefresh()}
        >
          {busy ? 'Checking…' : 'Refresh SES'}
        </Button>
      </div>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted-foreground)]">Domain</dt>
          <dd className="font-medium" dir="ltr">
            {app.primaryDomain ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Status</dt>
          <dd className="mt-1">
            <Chip color={mailDomainStatusChipColor(app.domainStatus)} size="sm" variant="soft">
              {formatMailDomainStatus(app.domainStatus)}
            </Chip>
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Last checked</dt>
          <dd className="font-medium">{formatMailDateTime(app.domainCheckedAt)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">SES on the API</dt>
          <dd className="font-medium">{app.sesRefreshAvailable ? 'Available' : 'Not configured'}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-[var(--muted-foreground)]">
        Full DKIM records remain in the Mail product. HQ shows the status stored in Postgres.
      </p>
    </section>
  );
}
