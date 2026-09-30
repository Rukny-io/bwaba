'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Reorder } from 'framer-motion';
import { Link2, Loader2, Plus } from 'lucide-react';
import { AddLinkCatalogDialog } from '@/components/app/links/add-link-catalog/add-link-catalog-dialog';
import { AddLinkMobileDialog } from '@/components/app/links/add-link-catalog/add-link-mobile-dialog';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { LinksPageActions } from '@/components/app/links/links-page-actions';
import { useProfilePreviewSync } from '@/components/app/links/profile-preview-provider';
import { SortableLinkCard } from '@/components/app/links/sortable-link-card';
import { ApiException } from '@/lib/api-client';
import { fetchMyProfile } from '@/lib/profile/api';
import type { MyProfile } from '@/lib/profile/types';
import {
  createLink,
  deleteLink,
  fetchMyLinks,
  reorderLinks,
  updateLink,
} from '@/lib/links/api';
import { getLinkDisplayLabel } from '@/lib/links/resolve-platform';
import type { CreateSocialLinkInput, SocialLink } from '@/lib/links/types';
import { cn } from '@/lib/utils';

export function LinksView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const linksRef = useRef(links);
  const reorderStartIdsRef = useRef<string[] | null>(null);

  linksRef.current = links;

  const loadLinks = useCallback(async () => {
    setError(null);
    try {
      const [linksData, profileData] = await Promise.all([
        fetchMyLinks(),
        fetchMyProfile(),
      ]);
      setLinks(linksData);
      setProfile(profileData);
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 404) {
        setError(
          'لم يُعثر على ملف شخصي. أكمل إعداد حسابك من الإعدادات أولاً.',
        );
      } else {
        setError(err instanceof Error ? err.message : 'تعذر تحميل الروابط');
      }
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setCatalogOpen(true);
      router.replace('/app/links', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const igStatus = searchParams.get('instagram');
    if (!igStatus) return;

    const linkId = searchParams.get('linkId');
    const cleanPath = '/app/links';

    if (igStatus === 'success') {
      setError(null);
      void loadLinks();
      router.replace(cleanPath, { scroll: false });
      if (linkId) {
        router.push(`/app/links/${linkId}`);
      }
      return;
    }

    if (igStatus === 'error') {
      const reason = searchParams.get('reason');
      setError(
        reason === 'server'
          ? 'تعذر ربط إنستغرام. تأكد أن الحساب احترافي وأعد المحاولة.'
          : `تعذر ربط إنستغرام${reason ? ` (${reason})` : ''}`,
      );
    }

    router.replace(cleanPath, { scroll: false });
  }, [searchParams, router, loadLinks]);

  async function handleCreatePayload(payload: CreateSocialLinkInput) {
    const created = await createLink(payload);
    setLinks((prev) =>
      [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder),
    );
  }

  async function handleToggleStatus(link: SocialLink) {
    setBusyId(link.id);
    try {
      const nextStatus = link.status === 'active' ? 'hidden' : 'active';
      const updated = await updateLink(link.id, { status: nextStatus });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث الحالة');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(link: SocialLink) {
    if (!window.confirm(`حذف "${getLinkDisplayLabel(link)}"؟`)) return;
    setBusyId(link.id);
    try {
      await deleteLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحذف');
    } finally {
      setBusyId(null);
    }
  }

  function handleReorder(next: SocialLink[]) {
    if (!reorderStartIdsRef.current) {
      reorderStartIdsRef.current = linksRef.current.map((l) => l.id);
    }
    setLinks(next);
  }

  async function handleReorderPointerUp() {
    const startIds = reorderStartIdsRef.current;
    if (!startIds) return;

    reorderStartIdsRef.current = null;
    const currentIds = linksRef.current.map((l) => l.id);
    if (startIds.join() === currentIds.join()) return;

    setBusyId('reorder');
    try {
      await reorderLinks(currentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إعادة الترتيب');
      await loadLinks();
    } finally {
      setBusyId(null);
    }
  }

  useProfilePreviewSync(profile, links);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        className="mb-0"
        title="روابطي"
        description="أضف روابطك ورتّبها كما تظهر في صفحتك العامة"
        actions={<LinksPageActions onAdd={() => setCatalogOpen(true)} />}
      />

      {error ? (
        <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3.5">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      ) : null}

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-16 text-center sm:py-20">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Link2 className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">لا توجد روابط بعد</p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
            أضف أول رابط لصفحتك الشخصية وابدأ بجمع النقرات.
          </p>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className={cn(
              'mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4',
              'text-sm font-semibold text-[var(--primary-foreground)]',
              'bg-[var(--primary)] shadow-[0_4px_14px_rgba(59,130,246,0.22)] hover:opacity-95',
            )}
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            إضافة رابط
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
            مرّر المؤشر على الرابط ثم اسحب لإعادة الترتيب
          </p>
          <Reorder.Group
            axis="y"
            values={links}
            onReorder={handleReorder}
            onPointerUp={() => void handleReorderPointerUp()}
            className="flex flex-col gap-4"
          >
            {links.map((link) => (
              <SortableLinkCard
                key={link.id}
                link={link}
                busyId={busyId}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onLinkUpdated={(updated) =>
                  setLinks((prev) =>
                    prev.map((item) => (item.id === updated.id ? updated : item)),
                  )
                }
                onThumbnailError={(message) => setError(message)}
              />
            ))}
          </Reorder.Group>
        </div>
      )}

      <AddLinkCatalogDialog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSubmit={handleCreatePayload}
      />
      <AddLinkMobileDialog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSubmit={handleCreatePayload}
      />
    </section>
  );
}
